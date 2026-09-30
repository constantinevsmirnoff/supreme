import type { ToolcraftProductSceneBoundsProvider } from "@/toolcraft/runtime";

export const floorSceneBounds: ToolcraftProductSceneBoundsProvider = ({ state }) => {
  const { height, width } = state.canvas.size;
  return [{ height, width, x: -width / 2, y: -height / 2 }];
};
