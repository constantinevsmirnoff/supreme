import type { FloorPattern } from "./floor-defaults";
import { clamp, lerp, valueNoise } from "./floor-math";

export type FloorColorSample = {
  b: number;
  g: number;
  hue: number;
  lightness: number;
  r: number;
  saturation: number;
};

function hueAmount(noise: number): number {
  const t = clamp(noise, 0, 0.999);
  if (t < 0.58) return (t / 0.58) * 0.16;
  if (t < 0.8) return 0.16 + ((t - 0.58) / 0.22) * 0.24;
  return 0.4 + ((t - 0.8) / 0.2) * 0.6;
}

function patternNoise(
  ix: number,
  iz: number,
  pattern: FloorPattern,
  patch: number,
  seed: number,
): number {
  const scale = Math.max(0.2, patch);
  if (pattern === "specks") return valueNoise(ix * 1.7, iz * 1.7, seed);
  if (pattern === "bands") return valueNoise(ix / scale, 0.15, seed);
  if (pattern === "drift") return valueNoise((ix + iz) / scale, (ix - iz) / (scale * 1.8), seed + 3);
  return valueNoise(ix / scale, iz / scale, seed);
}

export function hslToRgb(hue: number, saturation: number, lightness: number): [number, number, number] {
  const s = clamp(saturation, 0, 100) / 100;
  const l = clamp(lightness, 0, 100) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const h = ((hue % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = l - c / 2;
  const channel = h < 1 ? [c, x, 0] : h < 2 ? [x, c, 0] : h < 3 ? [0, c, x] : h < 4 ? [0, x, c] : h < 5 ? [x, 0, c] : [c, 0, x];
  return [channel[0] + m, channel[1] + m, channel[2] + m];
}

export function sampleFloorColor(input: {
  hue: readonly [number, number];
  ix: number;
  iz: number;
  lightness: readonly [number, number];
  patch: number;
  pattern: FloorPattern;
  rest: number;
  saturation: readonly [number, number];
  seed: number;
}): FloorColorSample {
  const noise = patternNoise(input.ix, input.iz, input.pattern, input.patch, input.seed);
  const stepped = Math.floor(clamp(noise, 0, 0.999) * 8) / 7;
  const hue = lerp(input.hue[0], input.hue[1], hueAmount(stepped));
  const saturation = lerp(input.saturation[0], input.saturation[1], valueNoise(input.iz * 0.37, input.ix * 0.37, input.seed + 11));
  const lightness = lerp(input.lightness[0], input.lightness[1], noise) + (input.rest - 0.12) * 4;
  const [r, g, b] = hslToRgb(hue, saturation, lightness);
  return { b, g, hue, lightness: clamp(lightness, 0, 100), r, saturation };
}
