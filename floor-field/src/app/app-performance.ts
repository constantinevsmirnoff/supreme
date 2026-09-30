import {
  defineToolcraftFixtureAdapter,
  defineToolcraftPerformance,
  defineToolcraftSchemaDiscreteFixtureAdapter,
  deriveToolcraftPerformancePaths,
  type ToolcraftEnvelopePerformanceConfig,
  type ToolcraftPerformancePath,
  type ToolcraftPerformanceScenario,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { floorPipeline } from "./floor/floor-pipeline";

const gpuException = {
  evidence:
    "Dawn reported VK_ERROR_INCOMPATIBLE_DRIVER, VGPU-WGSL-VALIDATE-NO-DEVICE, and VGPU-NODE-NO-ADAPTER, so this browser has no WebGPU adapter.",
  kind: "browser-compatibility",
} as const;

const performanceBase = {
  fixtureAdapters: {
    dimensions: {
      columns: defineToolcraftFixtureAdapter({
        apply: (value: number) => value,
        dimensionId: "columns",
        observe: (value: number) => value,
      }),
      "export-long-edge": defineToolcraftSchemaDiscreteFixtureAdapter(appSchema, {
        dimensionId: "export-long-edge",
        entries: [
          { appliedValue: "2k", value: 2048 },
          { appliedValue: "4k", value: 4096 },
          { appliedValue: "8k", value: 8192 },
        ],
        target: "export.image.resolution",
      }),
    },
  },
  rendererPipeline: floorPipeline,
  rendererStrategy: "webgl",
  rendererTechnique: {
    exportRenderer: "canvas-2d",
    fidelityRisks: [
      "Software WebGL can quantize lighting differently from a hardware GPU.",
    ],
    gpu: {
      export: {
        backend: "webgl",
        exception: gpuException,
        provider: "native",
      },
      preview: {
        backend: "webgl",
        exception: gpuException,
        provider: "native",
      },
    },
    layers: [
      {
        content: ["shader", "dense-pattern"],
        exportMode: "included",
        id: "floor-field",
        kind: "product-foreground",
        primitiveCount: "high",
        renderer: "webgl",
        uiSelector: "canvas[data-floor-field]",
      },
    ],
    performanceRisks: [
      "Cube count and export long edge multiply the instanced draw.",
    ],
    previewExportDifferenceReason:
      "Preview uses the live WebGL2 canvas. Export copies that same shader into the runtime 2D image frame.",
    previewRenderer: "webgl",
    productRepresentation: "pixel",
    rendererStrategy: "webgl",
    sourceRepresentation: "procedural-data",
    whyNotAlternativeStrategies: [
      "A fullscreen raymarch is too expensive for software WebGL while the user drags physics controls.",
      "DOM cells cannot share one camera, depth test, and exact export buffer.",
    ],
  },
  usesCustomRenderer: true,
  workloadEnvelope: {
    dimensions: [
      {
        batchMax: 32,
        defaultValue: 24,
        id: "columns",
        interactiveMax: 32,
        mapping: "direct",
        source: {
          kind: "schema-target",
          target: "field.columns",
          workloadBoundary: "maximum",
        },
        unit: "columns",
      },
      {
        batchMax: 8192,
        defaultValue: 4096,
        id: "export-long-edge",
        mapping: "direct",
        source: {
          kind: "schema-target",
          target: "export.image.resolution",
        },
        unit: "px",
      },
    ],
  },
} as const satisfies Omit<ToolcraftEnvelopePerformanceConfig, "scenarios">;

function createPerformanceScenario(path: ToolcraftPerformancePath): ToolcraftPerformanceScenario {
  const shared = {
    automated: true,
    automatedTestName: `browser perf: toolcraft path ${path.id}`,
    browser: true,
    browserTestName: `browser perf: toolcraft path ${path.id}`,
    coversTargets: path.targets,
    expectedObservable: "The cube field keeps the declared render path responsive for this interaction.",
    fixture: "Default pastel cube field",
    id: `floor-${path.interaction}`,
    pathId: path.id,
    target: path.targets[0],
  };
  if (path.interaction === "export") {
    return {
      ...shared,
      actionValue: "export.png",
      completionEvidence: "download",
      controlLabel: "Export PNG",
      interaction: "export",
    };
  }
  if (path.interaction === "control-drag") {
    return { ...shared, controlLabel: "Field count", interaction: "control-drag" };
  }
  if (path.interaction === "control-change") {
    return { ...shared, controlLabel: "Pattern", interaction: "control-change" };
  }
  return { ...shared, interaction: path.interaction };
}

const floorPerformancePaths = deriveToolcraftPerformancePaths(appSchema, {
  ...performanceBase,
  scenarios: [],
});

export const appPerformance: ToolcraftEnvelopePerformanceConfig = defineToolcraftPerformance({
  ...performanceBase,
  scenarios: floorPerformancePaths.map(createPerformanceScenario),
});
