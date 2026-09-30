import { test } from "./toolcraft-product-test";
import { dragControl, openFloor } from "./floor-proof-support";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expectToolcraftSegmentedControlCellsPreservePadding } from "./performance-control-layout-helpers";

const sliderTargets = [
  ["push.radius", "Radius"],
  ["push.depth", "Depth"],
  ["push.stiffness", "Stiffness"],
  ["push.damping", "Damping"],
  ["push.mass", "Mass"],
  ["push.lag", "Lag"],
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

test("browser: Falloff changes the cube field", async ({ page }) => {
  const session = await openFloor(page);
  await expectToolcraftSegmentedControlCellsPreservePadding(page, "Falloff", {
    requirementId: "push.falloff",
    target: "push.falloff",
  });
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("push.falloff", async (control) => {
      await control.scrollIntoViewIfNeeded();
      await control.getByRole("button", { name: "Wide" }).click();
    }),
    { requirementId: "push.falloff" },
  );
});
