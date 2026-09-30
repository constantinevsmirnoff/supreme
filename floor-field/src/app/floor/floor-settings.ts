import {
  floorAmbient,
  floorAzimuth,
  floorBackground,
  floorBevel,
  floorColumns,
  floorDamping,
  floorDepth,
  floorElevation,
  floorFalloffs,
  floorGap,
  floorHaze,
  floorHeight,
  floorHue,
  floorLag,
  floorLightness,
  floorLookTarget,
  floorMass,
  floorOrbitPosition,
  floorOrbitUp,
  floorPatch,
  floorPatterns,
  floorRadius,
  floorRelief,
  floorSaturation,
  floorSeed,
  floorShade,
  floorSheen,
  floorStiffness,
  type FloorFalloff,
  type FloorPattern,
} from "./floor-defaults";
import { clamp, parseHexColor, type Vec3 } from "./floor-math";

export type FloorPose = {
  position: [number, number, number];
  up: [number, number, number];
};

export type FloorSettings = {
  ambient: number;
  azimuth: number;
  background: [number, number, number];
  bevel: number;
  columns: number;
  damping: number;
  depth: number;
  elevation: number;
  falloff: FloorFalloff;
  floor: number;
  gap: number;
  haze: number;
  hue: readonly [number, number];
  includeBackground: boolean;
  lag: number;
  lightness: readonly [number, number];
  lookTarget: Vec3;
  mass: number;
  patch: number;
  pattern: FloorPattern;
  pose: FloorPose;
  radius: number;
  relief: number;
  saturation: readonly [number, number];
  seed: number;
  shade: number;
  sheen: number;
  stiffness: number;
};

function readNumber(value: unknown, fallback: number, min: number, max: number): number {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return clamp(numeric, min, max);
}

function readRange(
  value: unknown,
  fallback: readonly [number, number],
  min: number,
  max: number,
): readonly [number, number] {
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  ) {
    return [clamp(value[0], min, max), clamp(value[1], min, max)];
  }
  return fallback;
}

function readChoice<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return options.find((option) => option === value) ?? fallback;
}

function readVec3(value: unknown, fallback: readonly [number, number, number]): [number, number, number] {
  if (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  ) {
    return [value[0], value[1], value[2]];
  }
  return [fallback[0], fallback[1], fallback[2]];
}

export function readFloorPose(value: unknown): FloorPose {
  const pose = value && typeof value === "object" ? value as { position?: unknown; up?: unknown } : {};
  return {
    position: readVec3(pose.position, floorOrbitPosition),
    up: readVec3(pose.up, floorOrbitUp),
  };
}

export function readFloorSettingsFromValues(values: Record<string, unknown>): FloorSettings {
  const background = typeof values["appearance.background"] === "string"
    ? values["appearance.background"]
    : floorBackground;
  return {
    ambient: readNumber(values["light.ambient"], floorAmbient.defaultValue, floorAmbient.min, floorAmbient.max),
    azimuth: readNumber(values["light.azimuth"], floorAzimuth.defaultValue, floorAzimuth.min, floorAzimuth.max),
    background: parseHexColor(background),
    bevel: readNumber(values["field.bevel"], floorBevel.defaultValue, floorBevel.min, floorBevel.max),
    columns: Math.round(readNumber(values["field.columns"], floorColumns.defaultValue, floorColumns.min, floorColumns.max)),
    damping: readNumber(values["push.damping"], floorDamping.defaultValue, floorDamping.min, floorDamping.max),
    depth: readNumber(values["push.depth"], floorDepth.defaultValue, floorDepth.min, floorDepth.max),
    elevation: readNumber(values["light.elevation"], floorElevation.defaultValue, floorElevation.min, floorElevation.max),
    falloff: readChoice(values["push.falloff"], floorFalloffs, "soft"),
    floor: readNumber(values["field.floor"], floorHeight.defaultValue, floorHeight.min, floorHeight.max),
    gap: readNumber(values["field.gap"], floorGap.defaultValue, floorGap.min, floorGap.max),
    haze: readNumber(values["light.haze"], floorHaze.defaultValue, floorHaze.min, floorHaze.max),
    hue: readRange(values["palette.hue"], floorHue.defaultValue, floorHue.min, floorHue.max),
    includeBackground: values["export.includeBackground"] !== false,
    lag: readNumber(values["push.lag"], floorLag.defaultValue, floorLag.min, floorLag.max),
    lightness: readRange(values["palette.lightness"], floorLightness.defaultValue, floorLightness.min, floorLightness.max),
    lookTarget: floorLookTarget,
    mass: readNumber(values["push.mass"], floorMass.defaultValue, floorMass.min, floorMass.max),
    patch: readNumber(values["palette.patch"], floorPatch.defaultValue, floorPatch.min, floorPatch.max),
    pattern: readChoice(values["palette.pattern"], floorPatterns, "patches"),
    pose: readFloorPose(values["view.orbit"]),
    radius: readNumber(values["push.radius"], floorRadius.defaultValue, floorRadius.min, floorRadius.max),
    relief: readNumber(values["field.relief"], floorRelief.defaultValue, floorRelief.min, floorRelief.max),
    saturation: readRange(values["palette.saturation"], floorSaturation.defaultValue, floorSaturation.min, floorSaturation.max),
    seed: Math.round(readNumber(values["palette.seed"], floorSeed.defaultValue, floorSeed.min, floorSeed.max)),
    shade: readNumber(values["light.shade"], floorShade.defaultValue, floorShade.min, floorShade.max),
    sheen: readNumber(values["light.sheen"], floorSheen.defaultValue, floorSheen.min, floorSheen.max),
    stiffness: readNumber(values["push.stiffness"], floorStiffness.defaultValue, floorStiffness.min, floorStiffness.max),
  };
}

export function floorPushSignature(settings: FloorSettings): string {
  return [
    settings.radius,
    settings.depth,
    settings.stiffness,
    settings.damping,
    settings.mass,
    settings.lag,
    settings.falloff,
  ].join("|");
}
