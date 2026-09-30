import type { ToolcraftCommand } from "@/toolcraft/runtime";

import { floorSeed } from "./floor-defaults";

const seedSpan = floorSeed.max - floorSeed.min + 1;

export function handleFloorPanelAction(context: {
  action: { value: string };
  dispatch: (command: ToolcraftCommand) => void;
  state: { values: Record<string, unknown> };
}): void {
  if (context.action.value !== "shuffle") return;
  const current = context.state.values["palette.seed"];
  const seed = typeof current === "number" && Number.isFinite(current)
    ? Math.round(current)
    : floorSeed.defaultValue;
  const next = floorSeed.min + ((seed - floorSeed.min + 137) % seedSpan);
  context.dispatch({
    target: "palette.seed",
    type: "controls.setValue",
    value: next,
  });
}
