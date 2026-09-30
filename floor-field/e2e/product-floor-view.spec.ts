import { test, expect } from "./toolcraft-product-test";
import {
  backgroundRgba,
  chooseOption,
  exportPng,
  readOrientation,
  waitSettled,
  openFloor,
} from "./floor-proof-support";
import { dragToolcraftCanvasViewport } from "./performance-canvas-helpers";
import {
  expectToolcraftOrientationAxisDrag,
  expectToolcraftOrientationAxisSnap,
  expectToolcraftOrientationCanvasMissPan,
  expectToolcraftOrientationModelDrag,
  expectToolcraftOrientationUndoReset,
} from "./browser-orientation-gizmo-evidence-helpers";
import { expectExportExcludesCanvasHandles } from "./canvas-handle-helpers";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";

test("browser: orbit changes the cube field", async ({ page }) => {
  const session = await openFloor(page);
  const observation = session.observe(readOrientation);
  const options = {
    requirementId: "view.orbit",
    stabilityIntervalMs: 50,
    target: "view.orbit",
  };
  await waitSettled(page);
  const appRoot = page.locator('[data-slot="toolcraft-runtime-app"]');
  const baseline = await page.locator("[data-toolcraft-orientation-pose]").evaluate((node) => node.getAttribute("data-toolcraft-orientation-pose"));
  const baselineObservation = await appRoot.evaluate(readOrientation);
  await expectToolcraftOrientationModelDrag(observation, session, { ...options, dragDelta: { x: 36, y: -18 } });
  await waitSettled(page);
  const changed = await appRoot.evaluate(readOrientation);
  await expectToolcraftOrientationUndoReset(
    observation,
    session.action(async (currentPage) => {
      await currentPage.getByRole("button", { name: "Undo" }).click();
    }),
    session.action(async (currentPage) => {
      await currentPage.getByRole("button", { name: "Redo" }).click();
    }),
    session.action(async (currentPage) => {
      await currentPage.getByRole("button", { name: "Reset controls" }).click();
    }),
    baselineObservation,
    changed,
    options,
  );
  await expectToolcraftOrientationAxisDrag(observation, session, { ...options, dragDelta: { x: 24, y: 16 } });
  await expectToolcraftOrientationAxisSnap(observation, session, "+x", options);
  await expectToolcraftOrientationCanvasMissPan(
    observation,
    session.action(async (currentPage) => {
      await dragToolcraftCanvasViewport(currentPage, { x: 80, y: -40 });
    }),
    options,
  );
  await chooseOption(page, "export.image.resolution", "2K");
  await expectExportExcludesCanvasHandles(
    page,
    () => exportPng(page),
    async (download) => (await inspectToolcraftImageDownload({
      backgroundRgba,
      download,
      page,
    })).inspection,
    { requirementId: "view.orbit#export-clean", target: "view.orbit" },
  );
  expect(baseline).not.toBe("");
});
