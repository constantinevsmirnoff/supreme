import { describe, expect, it } from "vitest";

import { appSchema } from "../app-schema";
import { handleFloorPanelAction } from "./floor-actions";
import { sampleFloorColor } from "./floor-color";
import { floorBackground, floorHue, floorSeed } from "./floor-defaults";
import { createFloorCamera } from "./floor-gl";
import { floorBackingPixels, lightDirection } from "./floor-math";
import { cellFootprint, falloffWeight, stepSpring } from "./floor-physics";
import { floorSceneBounds } from "./floor-bounds";
import { readFloorSettingsFromValues, type FloorSettings } from "./floor-settings";
import { readFloorSimulation, resetFloorSimulation, stepFloorSimulation } from "./floor-simulation";

function settings(values: Record<string, unknown> = {}): FloorSettings {
  return readFloorSettingsFromValues(values);
}

function colorAt(values: Record<string, unknown>, ix = 3, iz = 5): string {
  const current = settings(values);
  const sample = sampleFloorColor({
    hue: current.hue,
    ix,
    iz,
    lightness: current.lightness,
    patch: current.patch,
    pattern: current.pattern,
    rest: 0.6,
    saturation: current.saturation,
    seed: current.seed,
  });
  return [sample.r, sample.g, sample.b].map((channel) => channel.toFixed(4)).join(",");
}

function pressedField(values: Record<string, unknown>): number[] {
  resetFloorSimulation();
  const current = settings(values);
  const camera = createFloorCamera(current, 16 / 9);
  for (let frame = 0; frame < 12; frame += 1) {
    stepFloorSimulation({
      dt: 1 / 60,
      now: 1000 + frame * 16,
      pointer: { x: 640, y: 360 },
      settings: current,
      suspend: false,
      viewProjection: camera.viewProjection,
      viewSize: { height: 720, width: 1280 },
    });
  }
  return Array.from(readFloorSimulation().heights);
}

function lowest(heights: number[]): number {
  return heights.reduce((min, height) => Math.min(min, height), Number.POSITIVE_INFINITY);
}

describe("floor field behavior", () => {
  it("floor field: field.columns changes the cube field", () => {
    resetFloorSimulation();
    stepFloorSimulation({
      dt: 0,
      now: 0,
      pointer: null,
      settings: settings({ "field.columns": 8 }),
      suspend: false,
      viewProjection: new Float32Array(16),
      viewSize: { height: 10, width: 10 },
    });
    expect(readFloorSimulation().rest.length).toBe(64);
    resetFloorSimulation();
    stepFloorSimulation({
      dt: 0,
      now: 0,
      pointer: null,
      settings: settings({ "field.columns": 12 }),
      suspend: false,
      viewProjection: new Float32Array(16),
      viewSize: { height: 10, width: 10 },
    });
    expect(readFloorSimulation().rest.length).toBe(144);
  });

  it("floor field: field.gap changes the cube field", () => {
    expect(cellFootprint(24, 0.02)).toBeGreaterThan(cellFootprint(24, 0.4));
  });

  it("floor field: field.bevel changes the cube field", () => {
    const narrow = settings({ "field.bevel": 0 });
    const wide = settings({ "field.bevel": 0.4 });
    expect(1 - wide.bevel).toBeLessThan(1 - narrow.bevel);
  });

  it("floor field: field.floor changes the cube field", () => {
    resetFloorSimulation();
    const short = settings({ "field.floor": 0.2 });
    const tall = settings({ "field.floor": 1.1 });
    stepFloorSimulation({
      dt: 0,
      now: 0,
      pointer: null,
      settings: short,
      suspend: false,
      viewProjection: new Float32Array(16),
      viewSize: { height: 10, width: 10 },
    });
    const shortHeight = readFloorSimulation().rest[0] ?? 0;
    resetFloorSimulation();
    stepFloorSimulation({
      dt: 0,
      now: 0,
      pointer: null,
      settings: tall,
      suspend: false,
      viewProjection: new Float32Array(16),
      viewSize: { height: 10, width: 10 },
    });
    expect(readFloorSimulation().rest[0] ?? 0).toBeGreaterThan(shortHeight);
  });

  it("floor field: field.relief changes the cube field", () => {
    resetFloorSimulation();
    const flat = settings({ "field.relief": 0 });
    const rough = settings({ "field.relief": 1 });
    const spread = (current: FloorSettings) => {
      stepFloorSimulation({
        dt: 0,
        now: 0,
        pointer: null,
        settings: current,
        suspend: false,
        viewProjection: new Float32Array(16),
        viewSize: { height: 10, width: 10 },
      });
      const rest = Array.from(readFloorSimulation().rest);
      return Math.max(...rest) - Math.min(...rest);
    };
    const flatSpread = spread(flat);
    resetFloorSimulation();
    expect(spread(rough)).toBeGreaterThan(flatSpread);
  });

  it("floor field: view.orbit changes the cube field", () => {
    const home = createFloorCamera(settings(), 16 / 9).viewProjection;
    const moved = createFloorCamera(settings({
      "view.orbit": { position: [2.2, 0.8, 0.4], up: [0, 1, 0] },
    }), 16 / 9).viewProjection;
    expect(Array.from(moved)).not.toEqual(Array.from(home));
  });

  it("floor field: palette.hue changes the cube field", () => {
    expect(colorAt({ "palette.hue": [200, 230] })).not.toBe(colorAt({ "palette.hue": [12, 40] }));
  });

  it("floor field: palette.saturation changes the cube field", () => {
    expect(colorAt({ "palette.saturation": [0, 4] })).not.toBe(colorAt({ "palette.saturation": [70, 90] }));
  });

  it("floor field: palette.lightness changes the cube field", () => {
    expect(colorAt({ "palette.lightness": [20, 30] })).not.toBe(colorAt({ "palette.lightness": [80, 90] }));
  });

  it("floor field: palette.patch changes the cube field", () => {
    expect(colorAt({ "palette.patch": 1 })).not.toBe(colorAt({ "palette.patch": 18 }));
  });

  it("floor field: palette.pattern changes the cube field", () => {
    expect(colorAt({ "palette.pattern": "bands" })).not.toBe(colorAt({ "palette.pattern": "specks" }));
  });

  it("floor field: palette.seed changes the cube field", () => {
    expect(colorAt({ "palette.seed": 3 })).not.toBe(colorAt({ "palette.seed": 90 }));
  });

  it("floor field: palette.shuffle changes the cube field", () => {
    const commands: unknown[] = [];
    handleFloorPanelAction({
      action: { value: "shuffle" },
      dispatch: (command) => commands.push(command),
      state: { values: { "palette.seed": floorSeed.defaultValue } },
    });
    expect(commands).toEqual([{
      target: "palette.seed",
      type: "controls.setValue",
      value: floorSeed.min + ((floorSeed.defaultValue - floorSeed.min + 137) % (floorSeed.max - floorSeed.min + 1)),
    }]);
    expect(colorAt({ "palette.seed": floorSeed.defaultValue })).not.toBe(colorAt({ "palette.seed": 155 }));
  });

  it("floor field: push.falloff changes the cube field", () => {
    expect(falloffWeight(80, 140, "wide")).toBeGreaterThan(falloffWeight(80, 140, "tight"));
  });

  it("floor field: push.radius changes the cube field", () => {
    expect(lowest(pressedField({ "push.radius": 40 }))).toBeGreaterThan(lowest(pressedField({ "push.radius": 480 })));
  });

  it("floor field: push.depth changes the cube field", () => {
    expect(lowest(pressedField({ "push.depth": 0.1 }))).toBeGreaterThan(lowest(pressedField({ "push.depth": 1 })));
  });

  it("floor field: push.stiffness changes the cube field", () => {
    const soft = stepSpring({ damping: 8, dt: 1 / 60, height: 0.8, mass: 1, stiffness: 20, target: 0.2, velocity: 0 });
    const firm = stepSpring({ damping: 8, dt: 1 / 60, height: 0.8, mass: 1, stiffness: 400, target: 0.2, velocity: 0 });
    expect(firm.height).toBeLessThan(soft.height);
    resetFloorSimulation();
    const current = settings();
    const camera = createFloorCamera(current, 16 / 9);
    const view = { height: 720, width: 1280 };
    for (let frame = 0; frame < 8; frame += 1) {
      stepFloorSimulation({
        dt: 1 / 60,
        now: frame * 16,
        pointer: { x: 640, y: 360 },
        settings: current,
        suspend: false,
        viewProjection: camera.viewProjection,
        viewSize: view,
      });
    }
    let moving = true;
    for (let frame = 0; frame < 360 && moving; frame += 1) {
      moving = stepFloorSimulation({
        dt: 1 / 60,
        now: 1000 + frame * 16,
        pointer: null,
        settings: current,
        suspend: false,
        viewProjection: camera.viewProjection,
        viewSize: view,
      });
    }
    const simulation = readFloorSimulation();
    expect(moving).toBe(false);
    expect(Array.from(simulation.heights)).toEqual(Array.from(simulation.rest));
  });

  it("floor field: push.damping changes the cube field", () => {
    const loose = stepSpring({ damping: 0.5, dt: 1 / 60, height: 0.4, mass: 1, stiffness: 220, target: 0.8, velocity: 2 });
    const tight = stepSpring({ damping: 40, dt: 1 / 60, height: 0.4, mass: 1, stiffness: 220, target: 0.8, velocity: 2 });
    expect(tight.velocity).toBeLessThan(loose.velocity);
  });

  it("floor field: push.mass changes the cube field", () => {
    const light = stepSpring({ damping: 8, dt: 1 / 60, height: 0.8, mass: 0.2, stiffness: 220, target: 0.2, velocity: 0 });
    const heavy = stepSpring({ damping: 8, dt: 1 / 60, height: 0.8, mass: 5, stiffness: 220, target: 0.2, velocity: 0 });
    expect(light.height).toBeLessThan(heavy.height);
  });

  it("floor field: push.lag changes the cube field", () => {
    const quick = pressedField({ "push.lag": 0 });
    const slow = pressedField({ "push.lag": 250 });
    expect(lowest(quick)).not.toBe(lowest(slow));
  });

  it("floor field: light.azimuth changes the cube field", () => {
    expect(lightDirection(10, 52)).not.toEqual(lightDirection(140, 52));
  });

  it("floor field: light.elevation changes the cube field", () => {
    expect(lightDirection(38, 8)[1]).toBeLessThan(lightDirection(38, 80)[1]);
  });

  it("floor field: light.shade changes the cube field", () => {
    const dim = settings({ "light.shade": 0.1 });
    const bright = settings({ "light.shade": 1 });
    expect(bright.shade).toBeGreaterThan(dim.shade);
    expect(bright.ambient + bright.shade).toBeGreaterThan(dim.ambient + dim.shade);
  });

  it("floor field: light.ambient changes the cube field", () => {
    expect(settings({ "light.ambient": 0.05 }).ambient).toBeLessThan(settings({ "light.ambient": 0.9 }).ambient);
  });

  it("floor field: light.sheen changes the cube field", () => {
    expect(settings({ "light.sheen": 0 }).sheen).toBeLessThan(settings({ "light.sheen": 0.8 }).sheen);
  });

  it("floor field: light.haze changes the cube field", () => {
    const clear = 1 - settings({ "light.haze": 0 }).haze * 0.28;
    const hazy = 1 - settings({ "light.haze": 1 }).haze * 0.28;
    expect(hazy).toBeLessThan(clear);
  });

  it("floor field: export.includeBackground changes the cube field", () => {
    expect(settings({ "export.includeBackground": true }).includeBackground).toBe(true);
    expect(settings({ "export.includeBackground": false }).includeBackground).toBe(false);
  });

  it("floor field: appearance.background changes the cube field", () => {
    expect(settings({ "appearance.background": "#2244AA" }).background).not.toEqual(settings().background);
    expect(settings().background).toEqual([
      Number.parseInt(floorBackground.slice(1, 3), 16) / 255,
      Number.parseInt(floorBackground.slice(3, 5), 16) / 255,
      Number.parseInt(floorBackground.slice(5, 7), 16) / 255,
    ]);
  });

  it("floor field: export.image.format changes the cube field", () => {
    const format = appSchema.panels.controls?.sections
      .flatMap((section) => Object.values(section.controls))
      .find((control) => control.target === "export.image.format");
    expect(format).toMatchObject({ defaultValue: "png", type: "select" });
    const formatOptions = format && "options" in format ? format.options : undefined;
    expect(formatOptions?.map((option) => option.value)).toEqual(["png", "jpg"]);
  });

  it("floor field: export.image.resolution changes the cube field", () => {
    const resolution = appSchema.panels.controls?.sections
      .flatMap((section) => Object.values(section.controls))
      .find((control) => control.target === "export.image.resolution");
    const resolutionOptions = resolution && "options" in resolution ? resolution.options : undefined;
    expect(resolutionOptions?.map((option) => option.value)).toEqual(["2k", "4k", "8k"]);
  });

  it("floor field: actions.output changes the cube field", () => {
    const action = appSchema.panels.controls?.sections
      .flatMap((section) => Object.values(section.controls))
      .find((control) => control.target === "actions.output");
    expect(action).toMatchObject({ type: "panelActions" });
  });

  it("floor field: canvas.renderScale keeps backing pixels", () => {
    expect(appSchema.canvas.renderScale.enabled).toBe(true);
    expect(floorBackingPixels(400, 2, 2)).toBe(1600);
    expect(floorBackingPixels(400, 2, 1)).toBe(800);
  });

  it("floor field: infinity mode keeps the cube field", () => {
    expect(appSchema.canvas.sizing).toEqual({ mode: "editable-output" });
    expect(floorHue.defaultValue).toEqual([12, 340]);
  });

  it("floor field: infinity export keeps the cube field", () => {
    const bounds = floorArtboard();
    expect(bounds).toEqual([{ height: 720, width: 1280, x: -640, y: -360 }]);
  });
});

function floorArtboard() {
  return floorSceneBounds({
    state: {
      canvas: { size: { height: 720, unit: "px", width: 1280 } },
    },
  } as Parameters<typeof floorSceneBounds>[0]);
}
