import { test } from "./toolcraft-product-test";
import { dragControl, openFloor } from "./floor-proof-support";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expectToolcraftDiscreteSliderMarkers } from "./performance-control-layout-helpers";

const sliderTargets = [
  ["field.gap", "Gap"],
  ["field.bevel", "Bevel"],
  ["field.floor", "Field height"],
  ["field.relief", "Relief"],
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

test("browser: Field count changes the cube field", async ({ page }) => {
  const session = await openFloor(page);
  await expectToolcraftDiscreteSliderMarkers(page, "field.columns", "field.columns");
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("field.columns", async (_control, currentPage) => {
      await dragControl(currentPage, "field.columns", 0.2);
    }),
    { requirementId: "field.columns" },
  );
});
