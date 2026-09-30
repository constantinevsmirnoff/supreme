import { test, expect } from "./toolcraft-product-test";
import {
  backgroundRgba,
  chooseOption,
  exportPng,
  floorCanvas,
  openFloor,
  setSwitch,
  waitSettled,
} from "./floor-proof-support";
import { expectToolcraftDiscreteSliderMarkers } from "./performance-control-layout-helpers";
import { dragToolcraftCanvasViewport } from "./performance-canvas-helpers";
import { expectToolcraftCanvasRenderScaleEvidence } from "./browser-render-scale-evidence";
import {
  expectToolcraftInfinityCanvasImageExportEvidence,
  expectToolcraftInfinityCanvasModeEvidence,
  observeInfinityCanvas,
} from "./browser-infinity-canvas-evidence";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";

test("browser: render scale keeps backing pixels", async ({ page }) => {
  await openFloor(page);
  await expectToolcraftDiscreteSliderMarkers(page, "canvas.renderScale", "canvas.render-scale");
  await expectToolcraftCanvasRenderScaleEvidence(page, {
    canvasSelector: floorCanvas,
    requirementId: "canvas.render-scale",
    selectedScale: 2,
    stateTransitions: [
      { run: async () => { await page.locator(floorCanvas).hover(); }, state: "interaction" },
      { run: async () => { await waitSettled(page); }, state: "steady" },
    ],
    target: "canvas.renderScale",
  });
});

test("browser: infinity mode keeps the cube field", async ({ page }) => {
  const session = await openFloor(page);
  const before = await observeInfinityCanvas(page);
  const scene = before.productScene.worldRect;
  if (!scene) throw new Error("The cube field has no scene rectangle.");
  await setSwitch(page, "canvas.infinity", true);
  const enabled = await observeInfinityCanvas(page);
  await dragToolcraftCanvasViewport(page, { x: 90, y: -36 });
  const afterPan = await observeInfinityCanvas(page);
  await session.reload();
  await expect(page.locator(floorCanvas)).toHaveAttribute("data-floor-ready", "true");
  const afterReload = await observeInfinityCanvas(page);
  await setSwitch(page, "canvas.infinity", false);
  const restored = await observeInfinityCanvas(page);
  await page.getByRole("button", { name: "Undo" }).click();
  const undone = await observeInfinityCanvas(page);
  await page.getByRole("button", { name: "Redo" }).click();
  const redone = await observeInfinityCanvas(page);
  const kept = { productHostPreserved: true, productOutputPreserved: true };
  await expectToolcraftInfinityCanvasModeEvidence(
    { afterPan, afterReload, before, enabled, redone, restored, undone },
    { afterReloadToRestored: kept, beforeToEnabled: kept, restoredToUndone: kept, undoneToRedone: kept },
    { expectedSceneRect: scene, requirementId: "canvas.infinity-mode", target: "canvas.infinity" },
  );
});

test("browser: infinity export keeps the cube field", async ({ page }) => {
  await openFloor(page);
  await chooseOption(page, "export.image.resolution", "2K");
  const finiteDownload = await exportPng(page);
  const finite = await inspectToolcraftImageDownload({ backgroundRgba, download: finiteDownload, page });
  await setSwitch(page, "canvas.infinity", true);
  const infiniteDownload = await exportPng(page);
  const infinite = await inspectToolcraftImageDownload({ backgroundRgba, download: infiniteDownload, page });
  await expectToolcraftInfinityCanvasImageExportEvidence(
    {
      finite: {
        byteLength: finite.inspection.byteLength,
        decodedPixelHash: finite.inspection.decodedPixelHash,
        height: finite.inspection.height,
        width: finite.inspection.width,
      },
      infinite: {
        byteLength: infinite.inspection.byteLength,
        decodedPixelHash: infinite.inspection.decodedPixelHash,
        height: infinite.inspection.height,
        width: infinite.inspection.width,
      },
    },
    {
      expectedSize: { height: 1152, width: 2048 },
      requirementId: "canvas.infinity-export",
      target: "actions.output",
    },
  );
});
