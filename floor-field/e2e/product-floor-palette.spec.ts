import { test } from "./toolcraft-product-test";
import { dragControl, openFloor, proveRange } from "./floor-proof-support";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expectToolcraftSegmentedControlCellsPreservePadding } from "./performance-control-layout-helpers";

const sliderTargets = [
  ["palette.patch", "Patch"],
  ["palette.seed", "Seed"],
] as const;

for (const [target, label] of sliderTargets) {
  test(`browser: ${label} changes the cube field`, async ({ page }) => {
    const session = await openFloor(page);
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (_control, currentPage) => {
        await dragControl(currentPage, target, 0.82);
      }),
      { requirementId: target },
    );
  });
}

test("browser: Pattern changes the cube field", async ({ page }) => {
  const session = await openFloor(page);
  await expectToolcraftSegmentedControlCellsPreservePadding(page, "Pattern", {
    requirementId: "palette.pattern",
    target: "palette.pattern",
  });
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("palette.pattern", async (control) => {
      await control.scrollIntoViewIfNeeded();
      await control.getByRole("button", { name: "Bands" }).click();
    }),
    { requirementId: "palette.pattern" },
  );
});

test("browser: Shuffle changes the cube field", async ({ page }) => {
  const session = await openFloor(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("palette.shuffle", async (control) => {
      await control.getByRole("button", { name: "Shuffle" }).click();
    }),
    { requirementId: "palette.shuffle" },
  );
});

test("browser: Hue changes the cube field", async ({ page }) => {
  await proveRange(page, "palette.hue", "palette.hue");
});

test("browser: Saturation changes the cube field", async ({ page }) => {
  await proveRange(page, "palette.saturation", "palette.saturation");
});

test("browser: Lightness changes the cube field", async ({ page }) => {
  await proveRange(page, "palette.lightness", "palette.lightness");
});
