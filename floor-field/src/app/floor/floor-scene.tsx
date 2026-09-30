import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import {
  useToolcraftModelOrbitInteraction,
  useToolcraftProductSceneFrame,
  useToolcraftSelector,
  useToolcraftValue,
  useToolcraftViewportInteractionActive,
} from "@/toolcraft/runtime/react";

import styles from "./floor-scene.module.css";
import {
  createFloorCamera,
  createFloorGl,
  createFloorProgram,
  drawFloorProgram,
  type FloorProgram,
} from "./floor-gl";
import { floorBackingPixels } from "./floor-math";
import { readFloorSettingsFromValues, type FloorSettings } from "./floor-settings";
import { ensureFloorField, stepFloorSimulation, type FloorPointer } from "./floor-simulation";

const floorValueTargets = [
  "appearance.background",
  "export.includeBackground",
  "field.bevel",
  "field.columns",
  "field.floor",
  "field.gap",
  "field.relief",
  "light.ambient",
  "light.azimuth",
  "light.elevation",
  "light.haze",
  "light.shade",
  "light.sheen",
  "palette.hue",
  "palette.lightness",
  "palette.patch",
  "palette.pattern",
  "palette.saturation",
  "palette.seed",
  "push.damping",
  "push.depth",
  "push.falloff",
  "push.lag",
  "push.mass",
  "push.radius",
  "push.stiffness",
  "view.orbit",
] as const;

function readRenderScale(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 2;
}

function parseFloorValues(encoded: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(encoded);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
  return Object.fromEntries(Object.entries(parsed));
}

function startFloorLoop(
  loopRef: { current: number },
  paintRef: { current: (dt: number, now: number) => boolean },
): void {
  if (loopRef.current !== 0) return;
  let last = performance.now();
  const tick = (now: number) => {
    const keepGoing = paintRef.current(Math.min(0.05, (now - last) / 1000), now);
    last = now;
    loopRef.current = keepGoing ? window.requestAnimationFrame(tick) : 0;
  };
  loopRef.current = window.requestAnimationFrame(tick);
}

export function FloorScene() {
  const frame = useToolcraftProductSceneFrame();
  const encodedValues = useToolcraftSelector((state) =>
    JSON.stringify(Object.fromEntries(floorValueTargets.map((target) => [target, state.values[target]]))),
  );
  const renderScaleValue = useToolcraftValue("canvas.renderScale");
  const viewportActive = useToolcraftViewportInteractionActive();
  const settings = useMemo(() => readFloorSettingsFromValues(parseFloorValues(encodedValues)), [encodedValues]);
  const [unsupported, setUnsupported] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const programRef = useRef<FloorProgram | null>(null);
  const pointerRef = useRef<FloorPointer | null>(null);
  const settingsRef = useRef<FloorSettings>(settings);
  const renderScaleRef = useRef(readRenderScale(renderScaleValue));
  const viewportActiveRef = useRef(viewportActive);
  const loopRef = useRef(0);
  const paintRef = useRef<(dt: number, now: number) => boolean>(() => false);
  settingsRef.current = settings;
  renderScaleRef.current = readRenderScale(renderScaleValue);
  viewportActiveRef.current = viewportActive;

  const orbit = useToolcraftModelOrbitInteraction<HTMLCanvasElement>({
    hitTest: () => true,
    target: "view.orbit",
  });
  const {
    onLostPointerCapture: endPointerCapture,
    onPointerCancel: cancelPointer,
    onPointerDown: beginPointer,
    onPointerMove: movePointer,
    onPointerUp: endPointer,
  } = orbit;

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frame.kind !== "ready") return undefined;
    if (!programRef.current) {
      const gl = createFloorGl(canvas);
      if (!gl) {
        setUnsupported(true);
        return undefined;
      }
      try {
        programRef.current = createFloorProgram(gl);
      } catch {
        setUnsupported(true);
        return undefined;
      }
    }
    const program = programRef.current;
    if (!program) return undefined;

    const paint = (dt: number, now: number): boolean => {
      const current = settingsRef.current;
      ensureFloorField(current);
      const rect = canvas.getBoundingClientRect();
      const viewSize = {
        height: Math.max(1, rect.height),
        width: Math.max(1, rect.width),
      };
      const camera = createFloorCamera(current, viewSize.width / viewSize.height);
      if (pointerRef.current && !canvas.matches(":hover")) pointerRef.current = null;
      const moving = stepFloorSimulation({
        dt,
        now,
        pointer: pointerRef.current,
        settings: current,
        suspend: viewportActiveRef.current,
        viewProjection: camera.viewProjection,
        viewSize,
      });
      const ratio = window.devicePixelRatio || 1;
      const width = floorBackingPixels(canvas.clientWidth, ratio, renderScaleRef.current);
      const height = floorBackingPixels(canvas.clientHeight, ratio, renderScaleRef.current);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      drawFloorProgram(program, { camera, height, settings: current, width });
      canvas.dataset.floorBackground = current.includeBackground ? "included" : "excluded";
      canvas.dataset.floorReady = "true";
      canvas.dataset.floorSettled = moving ? "false" : "true";
      return moving || pointerRef.current !== null;
    };

    paintRef.current = paint;
    paint(0, performance.now());
    startFloorLoop(loopRef, paintRef);
    return () => {
      window.cancelAnimationFrame(loopRef.current);
      loopRef.current = 0;
    };
  }, [encodedValues, frame, renderScaleValue, viewportActive]);

  useLayoutEffect(() => () => {
    const program = programRef.current;
    programRef.current = null;
    if (!program) return;
    program.gl.deleteProgram(program.program);
    program.gl.deleteBuffer(program.buffer);
    program.gl.deleteBuffer(program.instanceBuffer);
    program.gl.deleteVertexArray(program.vertexArray);
  }, []);

  const updatePointer = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    startFloorLoop(loopRef, paintRef);
  };

  if (frame.kind !== "ready") return null;
  if (unsupported) {
    return (
      <p className={styles.status} data-floor-status="unsupported" data-toolcraft-product-output="">
        This browser cannot show the cube field.
      </p>
    );
  }

  return (
    <div className={styles.scene}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        data-canvas-model-layer="floor-field"
        data-floor-field=""
        data-toolcraft-canvas-handle=""
        data-toolcraft-model-orbit-surface="true"
        data-toolcraft-product-output=""
        onLostPointerCapture={(event) => {
          endPointerCapture(event);
        }}
        onPointerCancel={(event) => {
          pointerRef.current = null;
          cancelPointer(event);
          startFloorLoop(loopRef, paintRef);
        }}
        onPointerDown={(event) => {
          updatePointer(event);
          beginPointer(event);
        }}
        onPointerMove={(event) => {
          updatePointer(event);
          movePointer(event);
        }}
        onPointerUp={(event) => {
          updatePointer(event);
          endPointer(event);
        }}
      />
    </div>
  );
}
