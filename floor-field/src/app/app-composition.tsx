import { composeToolcraftApp } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { handleFloorPanelAction } from "./floor/floor-actions";
import { floorSceneBounds } from "./floor/floor-bounds";
import { floorExportRenderer } from "./floor/floor-export";
import { floorPipeline } from "./floor/floor-pipeline";
import { FloorScene } from "./floor/floor-scene";

export const appComposition = composeToolcraftApp(appSchema, {
  actions: {
    onPanelAction: handleFloorPanelAction,
  },
  renderer: {
    pipelineRegistration: floorPipeline,
  },
  scene: {
    canvasContent: <FloorScene />,
    rasterFrameRenderer: floorExportRenderer,
    renderDefaultCanvasMedia: false,
    sceneBoundsProvider: floorSceneBounds,
  },
});
