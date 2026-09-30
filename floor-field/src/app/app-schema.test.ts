import { describe, expect, it } from "vitest";

import {
  appAcceptance,
  validateProductAcceptanceCoverage,
} from "./app-acceptance";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";

describe("appSchema", () => {
  it("publishes the floor field cube shader", () => {
    expect(appSchema.canvas.enabled).toBe(true);
    expect(appSchema.canvas.upload).toBe(false);
    expect(appSchema.canvas.sizing).toEqual({ mode: "editable-output" });
    expect(appSchema.canvas.size).toEqual({ height: 720, unit: "px", width: 1280 });
    expect(appSchema.panels.controls?.sections[1]?.title).toBe("Settings");
    expect(appSchema.panels.controls?.sections.map((section) => section.id)).toEqual([
      "runtime.defaults",
      "runtime.setup",
      "squares",
      "palette",
      "push",
      "light",
      "runtime.image-export",
      "runtime.export",
    ]);
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toBeUndefined();
    expect(appSchema.toolbar).toEqual({
      history: true,
      radar: true,
      theme: true,
      zoom: true,
    });
    expect(appSchema.modulePlan.modules.map(({ id }) => id)).toEqual([
      "image-export",
      "spatial-view",
    ]);
    expect(appSchema.assembly.capabilities).not.toContain("timeline.playback");
    expect(appPerformance.scenarios.length).toBeGreaterThan(0);
    expect(appPerformance.rendererStrategy).toBe("webgl");
  });

  it("declares production reload coverage for the starter schema", () => {
    expect(appSchema.persistence.storage).toBe("localStorage");
    if (appSchema.persistence.storage !== "localStorage") {
      throw new Error("Floor Field must persist user settings in localStorage.");
    }
    expect(appSchema.persistence.include).toContain("canvas");
    expect(
      appAcceptance.find((entry) => entry.id === "persistence.reload"),
    ).toMatchObject({
      automated: true,
      browser: {
        budget: "extended-io",
        file: "e2e/app-persistence.spec.ts",
      },
      evidence: "persistence-state",
      kind: "runtime",
      persistenceCoverage: "reload",
      persistenceSlices: appSchema.persistence.include,
      target: "canvas.size.width",
    });
    expect(validateProductAcceptanceCoverage()).toEqual([]);
  });
});
