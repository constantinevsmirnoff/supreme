import { test } from "./toolcraft-product-test";
import { backgroundRgba, chooseOption, exportPng, openFloor } from "./floor-proof-support";
import { expectToolcraftImageExportArtifact } from "./browser-media-export-evidence";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";
import {
  TOOLCRAFT_BACKGROUND_PIXEL_DISTANCE_THRESHOLD,
  getToolcraftRgbaDistance,
} from "./decoded-pixel-observation";

test("browser: export png writes the cube field", async ({ page }) => {
  const session = await openFloor(page);
  await chooseOption(page, "export.image.resolution", "2K");
  const learned = await inspectToolcraftImageDownload({
    backgroundRgba,
    download: await exportPng(page),
    page,
  });
  const size = 64;
  let sample = { found: false, rgba: [0, 0, 0, 255] as [number, number, number, number], x: 0, y: 0 };
  for (let y = 0; y < size && !sample.found; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const rgba = learned.observation.normalizedPixels.slice(offset, offset + 4);
      if (getToolcraftRgbaDistance(rgba, backgroundRgba) > TOOLCRAFT_BACKGROUND_PIXEL_DISTANCE_THRESHOLD) {
        sample = { found: true, rgba: [rgba[0] ?? 0, rgba[1] ?? 0, rgba[2] ?? 0, rgba[3] ?? 255], x, y };
        break;
      }
    }
  }
  if (!sample.found) throw new Error("The cube export did not contain a non-background sample.");
  const bounds = learned.inspection.nonBackgroundBounds;
  if (!bounds) throw new Error("The cube export did not contain product pixels.");
  await expectToolcraftImageExportArtifact(
    session.targetAction("actions.output", async (currentPage) => exportPng(currentPage)),
    {
      backgroundRgba,
      expectedBounds: bounds,
      expectedHeight: 1152,
      expectedMediaType: "image/png",
      expectedPixels: [{ rgba: sample.rgba, xRatio: sample.x / size, yRatio: sample.y / size }],
      expectedWidth: 2048,
      page,
      requirementId: "actions.output",
    },
  );
});
