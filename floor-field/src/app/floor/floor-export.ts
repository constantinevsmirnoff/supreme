import type { ToolcraftProductExportRenderer } from "@/toolcraft/runtime";

import { createFloorCamera, createFloorGl, createFloorProgram, drawFloorProgram } from "./floor-gl";
import { readFloorSettingsFromValues } from "./floor-settings";
import { ensureFloorField } from "./floor-simulation";

export const floorExportRenderer: ToolcraftProductExportRenderer = {
  baseFileName: "floor-field",
  renderFrame({ context, frame, signal, state }) {
    signal.throwIfAborted();
    const settings = readFloorSettingsFromValues(state.values);
    ensureFloorField(settings);
    const transform = context.getTransform();
    const width = Math.max(1, Math.round(frame.width * transform.a));
    const height = Math.max(1, Math.round(frame.height * transform.d));
    const canvas = new OffscreenCanvas(width, height);
    const gl = createFloorGl(canvas);
    if (!gl) return;
    const program = createFloorProgram(gl);
    try {
      const camera = createFloorCamera(settings, frame.width / Math.max(1, frame.height));
      drawFloorProgram(program, { camera, height, settings, width });
      context.drawImage(canvas, frame.x, frame.y, frame.width, frame.height);
    } finally {
      gl.deleteProgram(program.program);
      gl.deleteBuffer(program.buffer);
      gl.deleteBuffer(program.instanceBuffer);
      gl.deleteVertexArray(program.vertexArray);
    }
  },
};
