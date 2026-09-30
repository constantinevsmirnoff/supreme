export type Vec3 = readonly [number, number, number];

export function floorBackingPixels(css: number, devicePixelRatio: number, renderScale: number): number {
  return Math.max(1, Math.round(css * devicePixelRatio * renderScale));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

export function hashUnit(ix: number, iz: number, seed: number): number {
  let n = Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(seed | 0, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function fade(value: number): number {
  return value * value * (3 - 2 * value);
}

export function valueNoise(x: number, z: number, seed: number): number {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const tx = fade(x - x0);
  const tz = fade(z - z0);
  const v00 = hashUnit(x0, z0, seed);
  const v10 = hashUnit(x0 + 1, z0, seed);
  const v01 = hashUnit(x0, z0 + 1, seed);
  const v11 = hashUnit(x0 + 1, z0 + 1, seed);
  return lerp(lerp(v00, v10, tx), lerp(v01, v11, tx), tz);
}

export function normalize(vector: Vec3): [number, number, number] {
  const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

export function cross(left: Vec3, right: Vec3): [number, number, number] {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ];
}

export function dot(left: Vec3, right: Vec3): number {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

export function lightDirection(azimuthDegrees: number, elevationDegrees: number): [number, number, number] {
  const azimuth = (azimuthDegrees * Math.PI) / 180;
  const elevation = (elevationDegrees * Math.PI) / 180;
  return normalize([
    Math.cos(elevation) * Math.sin(azimuth),
    Math.sin(elevation),
    Math.cos(elevation) * Math.cos(azimuth),
  ]);
}

export function perspective(fovY: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan(fovY / 2);
  const range = 1 / (near - far);
  const matrix = new Float32Array(16);
  matrix[0] = f / aspect;
  matrix[5] = f;
  matrix[10] = (far + near) * range;
  matrix[11] = -1;
  matrix[14] = 2 * far * near * range;
  return matrix;
}

export function lookAt(eye: Vec3, target: Vec3, up: Vec3): Float32Array {
  const zAxis = normalize([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
  const xAxis = normalize(cross(up, zAxis));
  const yAxis = cross(zAxis, xAxis);
  const matrix = new Float32Array(16);
  matrix[0] = xAxis[0];
  matrix[1] = yAxis[0];
  matrix[2] = zAxis[0];
  matrix[4] = xAxis[1];
  matrix[5] = yAxis[1];
  matrix[6] = zAxis[1];
  matrix[8] = xAxis[2];
  matrix[9] = yAxis[2];
  matrix[10] = zAxis[2];
  matrix[12] = -dot(xAxis, eye);
  matrix[13] = -dot(yAxis, eye);
  matrix[14] = -dot(zAxis, eye);
  matrix[15] = 1;
  return matrix;
}

export function multiplyMat4(left: Float32Array, right: Float32Array): Float32Array {
  const out = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      out[column * 4 + row] =
        left[row] * right[column * 4] +
        left[4 + row] * right[column * 4 + 1] +
        left[8 + row] * right[column * 4 + 2] +
        left[12 + row] * right[column * 4 + 3];
    }
  }
  return out;
}

export function projectWorld(
  viewProjection: Float32Array,
  world: Vec3,
  width: number,
  height: number,
): { x: number; y: number } | null {
  const clipX = viewProjection[0] * world[0] + viewProjection[4] * world[1] + viewProjection[8] * world[2] + viewProjection[12];
  const clipY = viewProjection[1] * world[0] + viewProjection[5] * world[1] + viewProjection[9] * world[2] + viewProjection[13];
  const clipW = viewProjection[3] * world[0] + viewProjection[7] * world[1] + viewProjection[11] * world[2] + viewProjection[15];
  if (clipW <= 0.0001) return null;
  const invW = 1 / clipW;
  return {
    x: (clipX * invW * 0.5 + 0.5) * width,
    y: (1 - (clipY * invW * 0.5 + 0.5)) * height,
  };
}

export function parseHexColor(value: string): [number, number, number] {
  const hex = value.trim().replace("#", "");
  const normalized = hex.length === 3
    ? hex.split("").map((channel) => channel + channel).join("")
    : hex;
  const color = Number.parseInt(normalized, 16);
  if (!Number.isFinite(color) || normalized.length !== 6) return [243 / 255, 240 / 255, 234 / 255];
  return [((color >> 16) & 255) / 255, ((color >> 8) & 255) / 255, (color & 255) / 255];
}
