import { test } from "./toolcraft-product-test";
import { openFloor } from "./floor-proof-support";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";

test("browser: Floor color changes the cube field", async ({ page }) => {
  const session = await openFloor(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("appearance.background", async (control) => {
      const input = control.getByRole("textbox");
      await input.fill("#2244AA");
      await input.press("Enter");
    }),
    { requirementId: "appearance.background" },
  );
});
