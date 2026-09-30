import { sampleFloorColor } from "./floor-color";
import { cellRestHeight, falloffWeight, integrationSteps, pressedHeight, stepSpring } from "./floor-physics";
import { floorPushSignature, type FloorSettings } from "./floor-settings";
import { clamp, projectWorld } from "./floor-math";

export type FloorPointer = { x: number; y: number };

type FloorSimulationState = {
  colors: Float32Array;
  columns: number;
  heights: Float32Array;
  influence: number;
  lagged: FloorPointer | null;
  pushSignature: string;
  ready: boolean;
  replayReleaseAt: number;
  replayUntil: number;
  rest: Float32Array;
  seed: number;
  settled: boolean;
  velocities: Float32Array;
};

const simulation: FloorSimulationState = {
  colors: new Float32Array(0),
  columns: 0,
  heights: new Float32Array(0),
  influence: 0,
  lagged: null,
  pushSignature: "",
  ready: false,
  replayReleaseAt: 0,
  replayUntil: 0,
  rest: new Float32Array(0),
  seed: 0,
  settled: true,
  velocities: new Float32Array(0),
};

function rebuildField(settings: FloorSettings, snap: boolean): void {
  const count = settings.columns * settings.columns;
  if (simulation.columns !== settings.columns || simulation.rest.length !== count) {
    simulation.columns = settings.columns;
    simulation.rest = new Float32Array(count);
    simulation.heights = new Float32Array(count);
    simulation.velocities = new Float32Array(count);
    simulation.colors = new Float32Array(count * 3);
    snap = true;
  }
  for (let iz = 0; iz < settings.columns; iz += 1) {
    for (let ix = 0; ix < settings.columns; ix += 1) {
      const index = iz * settings.columns + ix;
      const rest = cellRestHeight({
        floor: settings.floor,
        ix,
        iz,
        relief: settings.relief,
        seed: settings.seed,
      });
      simulation.rest[index] = rest;
      const color = sampleFloorColor({
        hue: settings.hue,
        ix,
        iz,
        lightness: settings.lightness,
        patch: settings.patch,
        pattern: settings.pattern,
        rest,
        saturation: settings.saturation,
        seed: settings.seed,
      });
      simulation.colors[index * 3] = color.r;
      simulation.colors[index * 3 + 1] = color.g;
      simulation.colors[index * 3 + 2] = color.b;
      if (snap) {
        simulation.heights[index] = rest;
        simulation.velocities[index] = 0;
      }
    }
  }
  simulation.seed = settings.seed;
  simulation.ready = true;
}

export function resetFloorSimulation(): void {
  simulation.colors = new Float32Array(0);
  simulation.columns = 0;
  simulation.heights = new Float32Array(0);
  simulation.influence = 0;
  simulation.lagged = null;
  simulation.pushSignature = "";
  simulation.ready = false;
  simulation.replayReleaseAt = 0;
  simulation.replayUntil = 0;
  simulation.rest = new Float32Array(0);
  simulation.seed = 0;
  simulation.settled = true;
  simulation.velocities = new Float32Array(0);
}

export function ensureFloorField(settings: FloorSettings): void {
  if (!simulation.ready || simulation.columns !== settings.columns || simulation.seed !== settings.seed) {
    rebuildField(settings, true);
    simulation.pushSignature = floorPushSignature(settings);
  }
}

export function readFloorSimulation(): FloorSimulationState {
  return simulation;
}

function cellCenter(columns: number, index: number): { x: number; z: number } {
  const ix = index % columns;
  const iz = Math.floor(index / columns);
  const cell = 2 / columns;
  return {
    x: -1 + (ix + 0.5) * cell,
    z: -1 + (iz + 0.5) * cell,
  };
}

function follow(current: number, target: number, lagMs: number, dt: number): number {
  if (lagMs <= 0) return target;
  const amount = 1 - Math.exp(-dt / (lagMs / 1000));
  return current + (target - current) * clamp(amount, 0, 1);
}

export function stepFloorSimulation(input: {
  dt: number;
  now: number;
  pointer: FloorPointer | null;
  settings: FloorSettings;
  suspend: boolean;
  viewProjection: Float32Array;
  viewSize: { height: number; width: number };
}): boolean {
  const signature = floorPushSignature(input.settings);
  const snap = !simulation.ready || simulation.columns !== input.settings.columns || simulation.seed !== input.settings.seed;
  rebuildField(input.settings, snap);
  if (simulation.pushSignature && simulation.pushSignature !== signature) {
    simulation.replayReleaseAt = input.now + 350;
    simulation.replayUntil = input.now + 900;
  }
  simulation.pushSignature = signature;

  const replaying = input.now < simulation.replayUntil;
  const replayHeld = replaying && input.now < simulation.replayReleaseAt;
  const pointer = input.pointer ?? (replayHeld
    ? { x: input.viewSize.width / 2, y: input.viewSize.height / 2 }
    : null);
  if (pointer) {
    simulation.lagged = simulation.lagged
      ? {
          x: follow(simulation.lagged.x, pointer.x, input.settings.lag, input.dt),
          y: follow(simulation.lagged.y, pointer.y, input.settings.lag, input.dt),
        }
      : pointer;
    simulation.influence = follow(simulation.influence, 1, input.settings.lag, input.dt);
  } else {
    simulation.influence = follow(simulation.influence, 0, input.settings.lag, input.dt);
    if (simulation.influence < 0.001) simulation.lagged = null;
  }

  if (input.suspend) return !simulation.settled;

  const { count, step } = input.dt <= 0 ? { count: 0, step: 0 } : integrationSteps(input.dt);
  for (let substep = 0; substep < count; substep += 1) {
    for (let index = 0; index < simulation.rest.length; index += 1) {
      const center = cellCenter(input.settings.columns, index);
      const projected = simulation.lagged
        ? projectWorld(
            input.viewProjection,
            [center.x, simulation.heights[index] ?? 0, center.z],
            input.viewSize.width,
            input.viewSize.height,
          )
        : null;
      const distance = projected && simulation.lagged
        ? Math.hypot(projected.x - simulation.lagged.x, projected.y - simulation.lagged.y)
        : Number.POSITIVE_INFINITY;
      const weight = falloffWeight(distance, input.settings.radius, input.settings.falloff) * simulation.influence;
      const target = pressedHeight(simulation.rest[index] ?? 0, input.settings.depth, weight);
      const next = stepSpring({
        damping: input.settings.damping,
        dt: step,
        height: simulation.heights[index] ?? target,
        mass: input.settings.mass,
        stiffness: input.settings.stiffness,
        target,
        velocity: simulation.velocities[index] ?? 0,
      });
      simulation.heights[index] = next.height;
      simulation.velocities[index] = next.velocity;
    }
  }

  let moving = simulation.influence > 0.001 || replaying || pointer !== null;
  if (!moving) {
    for (let index = 0; index < simulation.rest.length; index += 1) {
      const height = simulation.heights[index] ?? 0;
      const velocity = simulation.velocities[index] ?? 0;
      const rest = simulation.rest[index] ?? 0;
      if (Math.abs(height - rest) > 0.0015 || Math.abs(velocity) > 0.01) {
        moving = true;
        break;
      }
    }
  }
  if (!moving) {
    for (let index = 0; index < simulation.rest.length; index += 1) {
      simulation.heights[index] = simulation.rest[index] ?? 0;
      simulation.velocities[index] = 0;
    }
    simulation.influence = 0;
    simulation.lagged = null;
  }
  simulation.settled = !moving;
  return !simulation.settled;
}
