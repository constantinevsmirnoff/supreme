import type { Download, Page } from "@playwright/test";

import { expect } from "./toolcraft-product-test";
import { dragToolcraftSliderByTarget } from "./performance-slider-helpers";
import type { ToolcraftOrientationBrowserObservation } from "./browser-orientation-gizmo-evidence-helpers";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { createToolcraftBrowserProofSession, type ToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";

export const floorCanvas = "canvas[data-floor-field]";
export const backgroundRgba = [243, 240, 234, 255] as const;

export async function dragControl(page: Page, target: string, ratio: number): Promise<void> {
  const field = await getToolcraftControlFieldByTarget(page, target);
  await field.scrollIntoViewIfNeeded();
  await dragToolcraftSliderByTarget(page, target, ratio);
}

export async function chooseOption(page: Page, target: string, label: string): Promise<void> {
  const field = await getToolcraftControlFieldByTarget(page, target);
  await field.getByRole("combobox").click();
  await page.getByRole("option", { name: label, exact: true }).click();
}

export async function exportPng(page: Page): Promise<Download> {
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /^Export (PNG|JPG)$/ }).click();
  return download;
}

export async function setSwitch(page: Page, target: string, checked: boolean): Promise<void> {
  const field = await getToolcraftControlFieldByTarget(page, target);
  const toggle = field.getByRole("switch");
  const checkedNow = (await toggle.getAttribute("aria-checked")) === "true";
  if (checkedNow !== checked) {
    await toggle.click();
  }
}

export function readOrientation(root: HTMLElement): ToolcraftOrientationBrowserObservation {
  const poseNode = root.querySelector("[data-toolcraft-orientation-pose]");
  const parsed: unknown = JSON.parse(poseNode?.getAttribute("data-toolcraft-orientation-pose") ?? "{}");
  const record = parsed && typeof parsed === "object" ? parsed : {};
  const position = "position" in record && Array.isArray(record.position) ? record.position : [];
  const up = "up" in record && Array.isArray(record.up) ? record.up : [];
  const canvas = root.querySelector("canvas[data-floor-field]");
  let signature = "";
  if (canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.height > 0) {
    const sample = document.createElement("canvas");
    sample.width = 64;
    sample.height = 36;
    const context = sample.getContext("2d");
    if (context) {
      context.drawImage(canvas, 0, 0, sample.width, sample.height);
      signature = sample.toDataURL();
    }
  }
  const world = root.querySelector("[data-toolcraft-canvas-world]");
  return {
    outputSignature: signature,
    pixelSignature: signature,
    pose: {
      position: [Number(position[0]), Number(position[1]), Number(position[2])],
      up: [Number(up[0]), Number(up[1]), Number(up[2])],
    },
    poseTarget: poseNode?.getAttribute("data-toolcraft-orientation-target") ?? "",
    presentationCacheKey: "floor-field-appearance",
    presentationDocumentId: "floor-field",
    viewportOffsetX: Number(world?.getAttribute("data-toolcraft-canvas-offset-x") ?? "0"),
    viewportOffsetY: Number(world?.getAttribute("data-toolcraft-canvas-offset-y") ?? "0"),
  };
}

export async function waitSettled(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Reset controls" }).hover();
  await expect(page.locator(floorCanvas)).toHaveAttribute("data-floor-settled", "true", { timeout: 8000 });
}

export async function openFloor(page: Page): Promise<ToolcraftBrowserProofSession> {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await expect(page.locator(floorCanvas)).toHaveAttribute("data-floor-ready", "true");
  await expect(page.locator(floorCanvas)).toHaveAttribute("data-floor-settled", "true");
  return session;
}

export async function proveRange(page: Page, target: string, requirementId: string): Promise<void> {
  const session = await openFloor(page);
  const read = session.observe(new Function("root", `
    const field = root.querySelector('[data-toolcraft-control-target="${target}"]');
    const thumbs = field ? field.querySelectorAll('input[type="range"]') : [];
    return {
      lower: Number(thumbs[0] && thumbs[0].getAttribute("aria-valuenow")),
      upper: Number(thumbs[1] && thumbs[1].getAttribute("aria-valuenow")),
    };
  `) as (root: HTMLElement) => { lower: number; upper: number });
  const field = await getToolcraftControlFieldByTarget(page, target);
  await field.scrollIntoViewIfNeeded();
  const initial = await field.locator('input[type="range"]').evaluateAll((nodes) =>
    nodes.map((node) => Number(node.getAttribute("aria-valuenow"))),
  );
  await expectToolcraftCompoundControlPartOutcome(
    read,
    session.controlAction(target, async (control, currentPage) => {
      await control.getByRole("slider").nth(0).focus();
      await currentPage.keyboard.press("ArrowRight");
    }),
    { lower: (initial[0] ?? 0) + 1, upper: initial[1] ?? 0 },
    { part: "rangeSlider.lower", requirementId, stabilityIntervalMs: 0 },
  );
  await expectToolcraftCompoundControlPartOutcome(
    read,
    session.controlAction(target, async (control, currentPage) => {
      await control.getByRole("slider").nth(1).focus();
      await currentPage.keyboard.press("ArrowLeft");
    }),
    { lower: (initial[0] ?? 0) + 1, upper: (initial[1] ?? 0) - 1 },
    { part: "rangeSlider.upper", requirementId, stabilityIntervalMs: 0 },
  );
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(target, async (_control, currentPage) => {
      await dragControl(currentPage, target, 0.7);
    }),
    { requirementId },
  );
}
