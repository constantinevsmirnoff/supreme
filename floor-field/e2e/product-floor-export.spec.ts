import fs from "node:fs/promises";

import { test, expect } from "./toolcraft-product-test";
import {
  backgroundRgba,
  chooseOption,
  exportPng,
  openFloor,
  setSwitch,
} from "./floor-proof-support";
import { expectToolcraftBackgroundOutputSemantics } from "./browser-background-output-evidence";
import {
  expectToolcraftInfinityCanvasBackgroundEvidence,
  observeInfinityCanvasBackground,
} from "./browser-infinity-canvas-evidence";
import { expectToolcraftExportedArtifact } from "./browser-acceptance-outcome-helpers";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";

test("browser: background changes the cube field", async ({ page }) => {
  const session = await openFloor(page);
  await chooseOption(page, "export.image.resolution", "2K");
  const preview = session.observe((root) => {
    const canvas = root.querySelector("canvas[data-floor-field]");
    const signature = canvas instanceof HTMLCanvasElement ? canvas.dataset.floorBackground ?? "" : "";
    return {
      backgroundVisible: signature !== "excluded",
      outputSignature: signature,
    };
  });
  await expectToolcraftBackgroundOutputSemantics(
    preview,
    session.controlAction("export.includeBackground", async (control) => {
      await control.getByRole("switch").click();
    }),
    { backgroundVisible: false, outputSignature: "excluded" },
    session.targetAction("actions.output", async (currentPage) => exportPng(currentPage)),
    async (download) => {
      const inspected = await inspectToolcraftImageDownload({ backgroundRgba, download, page });
      const bytes = await fs.readFile(await download.path() ?? "");
      const backgroundAlpha = await page.evaluate(async (base64) => {
        const binary = atob(base64);
        const data = Uint8Array.from(binary, (character) => character.charCodeAt(0));
        const bitmap = await createImageBitmap(new Blob([data]));
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext("2d");
        if (!context) return 255;
        context.drawImage(bitmap, 0, 0);
        const alpha = context.getImageData(0, 0, 1, 1).data[3] ?? 255;
        bitmap.close();
        return alpha;
      }, bytes.toString("base64"));
      return { ...inspected.inspection, backgroundAlpha };
    },
    { requirementId: "export.includeBackground" },
  );
  await setSwitch(page, "export.includeBackground", true);
  await setSwitch(page, "canvas.infinity", true);
  const infinite = await observeInfinityCanvasBackground(page);
  await setSwitch(page, "export.includeBackground", false);
  const backgroundExcluded = await observeInfinityCanvasBackground(page);
  await setSwitch(page, "export.includeBackground", true);
  const backgroundRestored = await observeInfinityCanvasBackground(page);
  await expectToolcraftInfinityCanvasBackgroundEvidence(
    { backgroundExcluded, backgroundRestored, infinite },
    {
      expectedBackgroundColor: "#F3F0EA",
      requirementId: "export.includeBackground",
      target: "export.includeBackground",
    },
  );
});

test("browser: format changes the export", async ({ page }) => {
  const session = await openFloor(page);
  await chooseOption(page, "export.image.resolution", "2K");
  await expectToolcraftExportedArtifact(
    session.targetAction("actions.output", async (currentPage) => exportPng(currentPage)),
    async (download) => (await inspectToolcraftImageDownload({ backgroundRgba, download, page })).inspection,
    { requirementId: "export.image.format" },
  );
  await chooseOption(page, "export.image.format", "JPG");
  const jpeg = await exportPng(page);
  const inspected = await inspectToolcraftImageDownload({ backgroundRgba, download: jpeg, page });
  expect(inspected.inspection.mediaType).toBe("image/jpeg");
});

test("browser: resolution changes the export", async ({ page }) => {
  const session = await openFloor(page);
  await chooseOption(page, "export.image.resolution", "2K");
  await expectToolcraftExportedArtifact(
    session.targetAction("actions.output", async (currentPage) => exportPng(currentPage)),
    async (download) => {
      const inspected = await inspectToolcraftImageDownload({ backgroundRgba, download, page });
      expect(inspected.inspection.width).toBe(2048);
      expect(inspected.inspection.height).toBe(1152);
      return inspected.inspection;
    },
    { requirementId: "export.image.resolution" },
  );
  await chooseOption(page, "export.image.resolution", "4K");
  await chooseOption(page, "export.image.resolution", "8K");
});
