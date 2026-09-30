export const floorColumns = {
  defaultValue: 24,
  max: 32,
  min: 8,
  step: 1,
} as const;

export const floorGap = { defaultValue: 0.12, max: 0.45, min: 0, step: 0.01 } as const;
export const floorBevel = { defaultValue: 0.04, max: 0.4, min: 0, step: 0.01 } as const;
export const floorHeight = { defaultValue: 0.2, max: 1.2, min: 0.04, step: 0.01 } as const;
export const floorRelief = { defaultValue: 0.82, max: 1, min: 0, step: 0.01 } as const;

export const floorHue = { defaultValue: [12, 340] as const, max: 360, min: 0, step: 1 } as const;
export const floorSaturation = { defaultValue: [38, 72] as const, max: 100, min: 0, step: 1 } as const;
export const floorLightness = { defaultValue: [62, 84] as const, max: 92, min: 20, step: 1 } as const;
export const floorPatch = { defaultValue: 4.8, max: 24, min: 1, step: 0.1 } as const;
export const floorSeed = { defaultValue: 47, max: 400, min: 1, step: 1 } as const;

export const floorRadius = { defaultValue: 140, max: 520, min: 20, step: 1 } as const;
export const floorDepth = { defaultValue: 0.55, max: 1, min: 0, step: 0.01 } as const;
export const floorStiffness = { defaultValue: 220, max: 500, min: 10, step: 1 } as const;
export const floorDamping = { defaultValue: 8, max: 40, min: 0.5, step: 0.1 } as const;
export const floorMass = { defaultValue: 1, max: 5, min: 0.2, step: 0.1 } as const;
export const floorLag = { defaultValue: 40, max: 250, min: 0, step: 1 } as const;

export const floorAzimuth = { defaultValue: 38, max: 360, min: 0, step: 1 } as const;
export const floorElevation = { defaultValue: 64, max: 80, min: 8, step: 1 } as const;
export const floorShade = { defaultValue: 0.82, max: 1, min: 0, step: 0.01 } as const;
export const floorAmbient = { defaultValue: 0.7, max: 1, min: 0, step: 0.01 } as const;
export const floorSheen = { defaultValue: 0.16, max: 1, min: 0, step: 0.01 } as const;
export const floorHaze = { defaultValue: 0.22, max: 1, min: 0, step: 0.01 } as const;

export const floorBackground = "#F3F0EA";
export const floorOrbitPosition = [1.05, 1.22, 1.18] as const;
export const floorOrbitUp = [0, 1, 0] as const;
export const floorLookTarget = [-0.05, 0.05, -0.02] as const;
export const floorFov = 0.86;

export const floorPatterns = ["patches", "bands", "drift", "specks"] as const;
export const floorFalloffs = ["soft", "linear", "tight", "wide"] as const;

export type FloorPattern = (typeof floorPatterns)[number];
export type FloorFalloff = (typeof floorFalloffs)[number];
