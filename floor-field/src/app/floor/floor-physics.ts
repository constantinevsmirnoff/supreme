import type { FloorFalloff } from "./floor-defaults";
import { clamp, valueNoise } from "./floor-math";

export function cellRestHeight(input: {
  floor: number;
  ix: number;
  iz: number;
  relief: number;
  seed: number;
}): number {
  const noise = valueNoise(input.ix * 0.73, input.iz * 0.73, input.seed + 17);
  return input.floor * (0.45 + input.relief * noise);
}

export function cellFootprint(columns: number, gap: number): number {
  return (2 / Math.max(1, columns)) * (1 - clamp(gap, 0, 0.95));
}

export function falloffWeight(distance: number, radius: number, mode: FloorFalloff): number {
  if (radius <= 0) return 0;
  const t = clamp(distance / radius, 0, 1);
  if (t >= 1) return 0;
  if (mode === "linear") return 1 - t;
  if (mode === "tight") return (1 - t) ** 3;
  if (mode === "wide") return (1 - t) ** 0.45;
  const smooth = t * t * (3 - 2 * t);
  return 1 - smooth;
}

export function pressedHeight(rest: number, depth: number, weight: number): number {
  return Math.max(0.04, rest * (1 - clamp(depth, 0, 1) * weight));
}

export function stepSpring(input: {
  damping: number;
  dt: number;
  height: number;
  mass: number;
  stiffness: number;
  target: number;
  velocity: number;
}): { height: number; velocity: number } {
  const mass = Math.max(0.05, input.mass);
  const acceleration = (input.stiffness * (input.target - input.height) - input.damping * input.velocity) / mass;
  const velocity = input.velocity + acceleration * input.dt;
  const height = Math.max(0.01, input.height + velocity * input.dt);
  return { height, velocity };
}

export function integrationSteps(dt: number): { count: number; step: number } {
  const clamped = clamp(dt, 0, 1 / 30);
  const count = Math.min(8, Math.max(1, Math.ceil(clamped / (1 / 120))));
  return { count, step: clamped / count };
}
