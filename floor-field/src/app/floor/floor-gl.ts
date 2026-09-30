import { floorFov } from "./floor-defaults";
import { cellFootprint } from "./floor-physics";
import { lightDirection, lookAt, multiplyMat4, perspective } from "./floor-math";
import { readFloorSimulation } from "./floor-simulation";
import type { FloorSettings } from "./floor-settings";

const vertexSource = `#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec4 aInstance;

uniform mat4 uViewProjection;
uniform float uColumns;
uniform float uGap;
uniform float uBevel;
uniform vec3 uLight;
uniform float uShade;
uniform float uAmbient;
uniform float uSheen;
uniform float uHaze;
uniform vec3 uBounce;
uniform float uBounceWeight;

out vec3 vColor;

void main() {
  float columns = max(uColumns, 1.0);
  int count = int(columns);
  int index = gl_InstanceID;
  int ix = index - (index / count) * count;
  int iz = index / count;
  float cell = 2.0 / columns;
  vec2 center = vec2(-1.0 + (float(ix) + 0.5) * cell, -1.0 + (float(iz) + 0.5) * cell);
  float footprint = cell * (1.0 - clamp(uGap, 0.0, 0.95));
  float taper = 1.0 - clamp(uBevel, 0.0, 0.95) * max(aPosition.y, 0.0);
  float height = max(aInstance.x, 0.01);
  vec3 world = vec3(center.x + aPosition.x * footprint * taper, aPosition.y * height, center.y + aPosition.z * footprint * taper);
  gl_Position = uViewProjection * vec4(world, 1.0);

  vec3 normal = normalize(aNormal);
  float lambert = max(dot(normal, normalize(uLight)), 0.0);
  float top = smoothstep(0.55, 1.0, normal.y);
  float key = clamp(uShade * lambert + uSheen * top, 0.0, 1.0);
  float light = mix(clamp(uAmbient, 0.0, 1.0), 1.0, key);
  float distance = clamp(length(world.xz), 0.0, 1.4);
  light *= 1.0 - uHaze * distance * 0.28;
  vec3 color = aInstance.yzw * light;
  color = mix(color, uBounce, uBounceWeight * (0.16 + 0.1 * top));
  vColor = color;
}
`;

const fragmentSource = `#version 300 es
precision highp float;
in vec3 vColor;
out vec4 fragColor;

void main() {
  vec3 color = floor(clamp(vColor, 0.0, 1.0) * 255.0 + 0.5) / 255.0;
  fragColor = vec4(color, 1.0);
}
`;

export type FloorCamera = {
  viewProjection: Float32Array;
};

export type FloorDrawInput = {
  camera: FloorCamera;
  height: number;
  settings: FloorSettings;
  width: number;
};

export type FloorProgram = {
  buffer: WebGLBuffer;
  gl: WebGL2RenderingContext;
  indexCount: number;
  instanceBuffer: WebGLBuffer;
  instanceCapacity: number;
  program: WebGLProgram;
  uniforms: {
    ambient: WebGLUniformLocation;
    bevel: WebGLUniformLocation;
    bounce: WebGLUniformLocation;
    bounceWeight: WebGLUniformLocation;
    columns: WebGLUniformLocation;
    gap: WebGLUniformLocation;
    haze: WebGLUniformLocation;
    light: WebGLUniformLocation;
    shade: WebGLUniformLocation;
    sheen: WebGLUniformLocation;
    viewProjection: WebGLUniformLocation;
  };
  vertexArray: WebGLVertexArrayObject;
};

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("WebGL could not create a shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "unknown shader error";
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

function requireUniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): WebGLUniformLocation {
  const location = gl.getUniformLocation(program, name);
  if (!location) throw new Error(`WebGL uniform ${name} is missing.`);
  return location;
}

function createCube(): { indices: Uint16Array; normals: Float32Array; positions: Float32Array } {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const faces: Array<{ corners: Array<[number, number, number]>; normal: [number, number, number] }> = [
    { normal: [0, 0, 1], corners: [[-0.5, 0, 0.5], [0.5, 0, 0.5], [0.5, 1, 0.5], [-0.5, 1, 0.5]] },
    { normal: [0, 0, -1], corners: [[0.5, 0, -0.5], [-0.5, 0, -0.5], [-0.5, 1, -0.5], [0.5, 1, -0.5]] },
    { normal: [-1, 0, 0], corners: [[-0.5, 0, -0.5], [-0.5, 0, 0.5], [-0.5, 1, 0.5], [-0.5, 1, -0.5]] },
    { normal: [1, 0, 0], corners: [[0.5, 0, 0.5], [0.5, 0, -0.5], [0.5, 1, -0.5], [0.5, 1, 0.5]] },
    { normal: [0, 1, 0], corners: [[-0.5, 1, 0.5], [0.5, 1, 0.5], [0.5, 1, -0.5], [-0.5, 1, -0.5]] },
    { normal: [0, -1, 0], corners: [[-0.5, 0, -0.5], [0.5, 0, -0.5], [0.5, 0, 0.5], [-0.5, 0, 0.5]] },
  ];
  for (const face of faces) {
    const base = positions.length / 3;
    for (const corner of face.corners) {
      positions.push(corner[0], corner[1], corner[2]);
      normals.push(face.normal[0], face.normal[1], face.normal[2]);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return {
    indices: new Uint16Array(indices),
    normals: new Float32Array(normals),
    positions: new Float32Array(positions),
  };
}

export function createFloorCamera(settings: FloorSettings, aspect: number): FloorCamera {
  const projection = perspective(floorFov, Math.max(0.2, aspect), 0.05, 24);
  const view = lookAt(settings.pose.position, settings.lookTarget, settings.pose.up);
  return { viewProjection: multiplyMat4(projection, view) };
}

export function createFloorProgram(gl: WebGL2RenderingContext): FloorProgram {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error("WebGL could not create a program.");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? "unknown link error";
    gl.deleteProgram(program);
    throw new Error(log);
  }

  const cube = createCube();
  const vertexArray = gl.createVertexArray();
  const buffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  const instanceBuffer = gl.createBuffer();
  if (!vertexArray || !buffer || !indexBuffer || !instanceBuffer) {
    throw new Error("WebGL could not create geometry buffers.");
  }
  gl.bindVertexArray(vertexArray);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, (cube.positions.length + cube.normals.length) * 4, gl.STATIC_DRAW);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, cube.positions);
  gl.bufferSubData(gl.ARRAY_BUFFER, cube.positions.byteLength, cube.normals);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, cube.positions.byteLength);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cube.indices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, 16, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 16, 0);
  gl.vertexAttribDivisor(2, 1);
  gl.bindVertexArray(null);

  return {
    buffer,
    gl,
    indexCount: cube.indices.length,
    instanceBuffer,
    instanceCapacity: 0,
    program,
    uniforms: {
      ambient: requireUniform(gl, program, "uAmbient"),
      bevel: requireUniform(gl, program, "uBevel"),
      bounce: requireUniform(gl, program, "uBounce"),
      bounceWeight: requireUniform(gl, program, "uBounceWeight"),
      columns: requireUniform(gl, program, "uColumns"),
      gap: requireUniform(gl, program, "uGap"),
      haze: requireUniform(gl, program, "uHaze"),
      light: requireUniform(gl, program, "uLight"),
      shade: requireUniform(gl, program, "uShade"),
      sheen: requireUniform(gl, program, "uSheen"),
      viewProjection: requireUniform(gl, program, "uViewProjection"),
    },
    vertexArray,
  };
}

export function drawFloorProgram(program: FloorProgram, input: FloorDrawInput): void {
  const { gl } = program;
  const simulation = readFloorSimulation();
  const count = simulation.heights.length;
  if (count === 0) return;
  if (program.instanceCapacity < count) {
    program.instanceCapacity = count;
    gl.bindBuffer(gl.ARRAY_BUFFER, program.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, count * 16, gl.DYNAMIC_DRAW);
  }
  const instances = new Float32Array(count * 4);
  for (let index = 0; index < count; index += 1) {
    instances[index * 4] = simulation.heights[index] ?? 0;
    instances[index * 4 + 1] = simulation.colors[index * 3] ?? 0;
    instances[index * 4 + 2] = simulation.colors[index * 3 + 1] ?? 0;
    instances[index * 4 + 3] = simulation.colors[index * 3 + 2] ?? 0;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, program.instanceBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, instances);

  gl.viewport(0, 0, input.width, input.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.useProgram(program.program);
  gl.uniformMatrix4fv(program.uniforms.viewProjection, false, input.camera.viewProjection);
  gl.uniform1f(program.uniforms.columns, input.settings.columns);
  gl.uniform1f(program.uniforms.gap, input.settings.gap);
  gl.uniform1f(program.uniforms.bevel, input.settings.bevel);
  const light = lightDirection(input.settings.azimuth, input.settings.elevation);
  gl.uniform3f(program.uniforms.light, light[0], light[1], light[2]);
  gl.uniform1f(program.uniforms.shade, input.settings.shade);
  gl.uniform1f(program.uniforms.ambient, input.settings.ambient);
  gl.uniform1f(program.uniforms.sheen, input.settings.sheen);
  gl.uniform1f(program.uniforms.haze, input.settings.haze);
  gl.uniform3f(
    program.uniforms.bounce,
    input.settings.background[0],
    input.settings.background[1],
    input.settings.background[2],
  );
  gl.uniform1f(program.uniforms.bounceWeight, input.settings.includeBackground ? 0.22 : 0);
  gl.bindVertexArray(program.vertexArray);
  gl.drawElementsInstanced(gl.TRIANGLES, program.indexCount, gl.UNSIGNED_SHORT, 0, count);
  gl.bindVertexArray(null);
}

export function floorCellFootprint(settings: FloorSettings): number {
  return cellFootprint(settings.columns, settings.gap);
}

export function createFloorGl(canvas: HTMLCanvasElement | OffscreenCanvas): WebGL2RenderingContext | null {
  const gl = canvas.getContext("webgl2", JSON.parse("{\"alpha\":true,\"antialias\":false,\"depth\":true,\"premultipliedAlpha\":true,\"preserveDrawingBuffer\":true}"));
  return gl instanceof WebGL2RenderingContext ? gl : null;
}
