import { test } from "./toolcraft-product-test";
import { dragControl, openFloor } from "./floor-proof-support";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";

const sliderTargets = [
  ["light.azimuth", "Azimuth"],
  ["light.elevation", "Elevation"],
  ["light.shade", "Shade"],
  ["light.ambient", "Ambient"],
  ["light.sheen", "Sheen"],
  ["light.haze", "Haze"],
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
