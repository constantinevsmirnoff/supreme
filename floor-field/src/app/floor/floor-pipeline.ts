import {
  registerToolcraftRendererPipeline,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";

const webglPreview = {
  resources: "uniforms-only",
  stage: "render",
  state: "stateless",
  surfaces: ["preview"],
} as const;

const webglExport = {
  resources: "uniforms-only",
  stage: "render",
  state: "stateless",
  surfaces: ["export"],
} as const;

const fieldBounds = {
  kind: "intrinsic",
  reason: "Every colored cube is authored inside the finite artboard rectangle.",
} as const;

type FloorPassContracts = {
  "floor-draw": ToolcraftRendererPipelinePassContract<void>;
  "floor-export": ToolcraftRendererPipelinePassContract<void>;
  "floor-simulate": ToolcraftRendererPipelinePassContract<void>;
};

export const floorPipeline = registerToolcraftRendererPipeline<FloorPassContracts>()({
  interactionInvalidation: [
    {
      interaction: "initial-render",
      invalidates: ["floor-simulate", "floor-draw"],
      mustNotInvalidate: ["floor-export"],
      targets: ["field.columns", "view.orbit"],
    },
    {
      interaction: "animation-frame",
      invalidates: ["floor-simulate", "floor-draw"],
      mustNotInvalidate: ["floor-export"],
      targets: ["pointer.cursor"],
    },
    {
      interaction: "control-drag",
      invalidates: ["floor-simulate", "floor-draw"],
      mustNotInvalidate: ["floor-export"],
      targets: [
        "field.bevel",
        "field.columns",
        "field.floor",
        "field.gap",
        "field.relief",
        "light.ambient",
        "light.azimuth",
        "light.elevation",
        "light.haze",
        "light.shade",
        "light.sheen",
        "palette.hue",
        "palette.lightness",
        "palette.patch",
        "palette.saturation",
        "palette.seed",
        "push.damping",
        "push.depth",
        "push.lag",
        "push.mass",
        "push.radius",
        "push.stiffness",
        "view.orbit",
      ],
    },
    {
      interaction: "control-change",
      invalidates: ["floor-simulate", "floor-draw"],
      mustNotInvalidate: ["floor-export"],
      targets: [
        "appearance.background",
        "export.image.format",
        "export.image.resolution",
        "export.includeBackground",
        "palette.pattern",
        "palette.shuffle",
        "push.falloff",
      ],
    },
    {
      interaction: "viewport-drag",
      invalidates: [],
      mustNotInvalidate: ["floor-simulate", "floor-draw", "floor-export"],
      targets: ["canvas.viewport.offset"],
    },
    {
      interaction: "viewport-zoom",
      invalidates: [],
      mustNotInvalidate: ["floor-simulate", "floor-draw", "floor-export"],
      targets: ["canvas.viewport.zoom"],
    },
    {
      interaction: "export",
      invalidates: ["floor-export"],
      mustNotInvalidate: ["floor-simulate", "floor-draw"],
      targets: ["actions.output"],
    },
  ],
  passes: [
    {
      cost: {
        dimensions: ["columns"],
        frequency: "frame",
        relationship: "linear",
      },
      id: "floor-simulate",
      inputs: ["field.columns", "pointer.cursor"],
      invalidatedBy: ["field.columns", "pointer.cursor", "push.depth"],
      kind: "vector-build",
      lifecycle: { cache: "none", resourceScope: "call" },
      output: "intermediate",
      quality: "full",
      runsOn: "main",
      sceneBounds: fieldBounds,
    },
    {
      cost: {
        dimensions: ["columns"],
        frequency: "frame",
        relationship: "linear",
      },
      gpu: webglPreview,
      id: "floor-draw",
      inputs: ["floor-simulate", "view.orbit"],
      invalidatedBy: ["appearance.background", "floor-simulate", "view.orbit"],
      kind: "composite",
      lifecycle: { cache: "none", resourceScope: "call" },
      output: "preview",
      quality: "retina",
      runsOn: "gpu",
      sceneBounds: fieldBounds,
    },
    {
      cost: {
        dimensions: ["columns", "export-long-edge"],
        frequency: "batch",
        relationship: "product",
      },
      gpu: webglExport,
      id: "floor-export",
      inputs: ["export.image.resolution", "floor-draw"],
      invalidatedBy: ["actions.output", "export.image.resolution"],
      kind: "composite",
      lifecycle: { cache: "none", resourceScope: "call" },
      output: "export",
      quality: "export",
      runsOn: "gpu",
    },
  ],
  runtimeId: "floor-field",
});
