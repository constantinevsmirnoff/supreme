import type { Download, Page } from "@playwright/test";
import { deriveToolcraftPerformancePaths } from "@/toolcraft/runtime";

import { appPerformance } from "../src/app/app-performance";
import { appSchema } from "../src/app/app-schema";
import type { ToolcraftPerformancePathAdapter } from "./performance-path-adapter-contract";

const floorPaths = deriveToolcraftPerformancePaths(appSchema, appPerformance);

async function prepareFloor(page: Page): Promise<void> {
  await page.goto("/");
  await page.locator("canvas[data-floor-field]").waitFor();
}

function floorAdapter(pathId: string, interaction: string): ToolcraftPerformancePathAdapter {
  if (interaction === "export") {
    return {
      output: {
        kind: "download",
        label: "Export PNG",
        verify: async (download: Download) => {
          if (!download.suggestedFilename().toLowerCase().endsWith(".png")) {
            throw new Error("Floor Field export should download a PNG.");
          }
        },
      },
      pathId,
      prepare: prepareFloor,
    };
  }

  const adapter: ToolcraftPerformancePathAdapter = {
    action: async ({ page }) => {
      if (interaction === "control-drag") {
        const slider = page.locator('[data-toolcraft-control-target="field.columns"] input[type="range"]').first();
        await slider.focus();
        await page.keyboard.press("ArrowRight");
        return;
      }
      if (interaction === "control-change") {
        await page.locator('[data-toolcraft-control-target="palette.pattern"]').getByRole("button", { name: "Bands" }).click();
        return;
      }
      if (interaction === "viewport-drag" || interaction === "viewport-zoom") {
        return;
      }
      await page.locator("canvas[data-floor-field]").hover();
    },
    pathId,
    prepare: prepareFloor,
  };

  if (interaction === "control-change" || interaction === "control-drag") {
    return {
      ...adapter,
      observeOutcome: async ({ page }) => page.locator("canvas[data-floor-field]").evaluate((canvas) => {
        if (!(canvas instanceof HTMLCanvasElement)) return "missing";
        return canvas.toDataURL();
      }),
    };
  }

  return adapter;
}

export const appPerformanceCanvasBacking = {
  canvasSelector: "canvas[data-floor-field]",
};

export const appPerformancePathAdapters: readonly ToolcraftPerformancePathAdapter[] =
  floorPaths.map((path) => floorAdapter(path.id, path.interaction));
