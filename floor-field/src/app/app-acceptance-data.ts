import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";
import { appSchema } from "./app-schema";

const starterPersistenceSlices =
  appSchema.persistence.storage === "localStorage"
    ? appSchema.persistence.include
    : [];

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: { mode: "none" },
  mode: "new-toolcraft-app",
  referenceInputs: [],
};

export const appProductReadiness: ToolcraftProductReadiness = {
  exportIntent: {
    image: { mode: "toolcraft-default" },
    svg: { mode: "not-requested" },
    video: { mode: "not-requested" },
  },
  interactionOwnership: [
    {
      alternative: {
        reason: "Typing camera numbers would hide the direct sweep across the colored cubes.",
        surface: "panel",
      },
      capability: "direct-spatial-edit",
      evidence: {
        detail: "The requested cursor press lives on the canvas, so orbit stays on that same field.",
        source: "user-request",
      },
      id: "orbit-pose",
      reason: "Dragging the cube field orbits the camera while the cursor presses the cubes underneath.",
      surface: "canvas",
      target: "view.orbit",
    },
  ],
  mode: "product",
  productName: "Floor Field",
  productSummary: "A pastel field of cubes that spring down under the cursor and bounce back.",
  requestedBehavior:
    "Control a shader floor of colored squares, push them with the cursor, and experiment with physics, color, timing, and size.",
  viewInteraction: {
    mode: "orbit",
    orientationTargets: ["view.orbit"],
  },
};

function browserProof(
  domain: string,
  testName: string,
  budget: "extended-io" | "standard" = "standard",
): ToolcraftComponentAcceptance["browser"] {
  return {
    budget,
    file: `e2e/product-floor-${domain}.spec.ts`,
    testName,
  };
}

function controlAcceptance(
  id: string,
  componentType: string,
  label: string,
  extra: Partial<ToolcraftComponentAcceptance> = {},
): ToolcraftComponentAcceptance {
  return {
    automated: true,
    automatedTestName: `floor field: ${id} changes the cube field`,
    componentType,
    evidence: "rendered-pixels",
    expectedObservable: `Changing ${label} changes the rendered cube field.`,
    fixture: "Default pastel cube field",
    id,
    kind: "control",
    target: id,
    userAction: `Change ${label}.`,
    ...extra,
    browser: extra.browser ?? browserProof(id.split(".")[0] ?? id, `browser: ${label} changes the cube field`),
  };
}

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  controlAcceptance("field.columns", "slider", "Field count"),
  controlAcceptance("field.gap", "slider", "Gap"),
  controlAcceptance("field.bevel", "slider", "Bevel"),
  controlAcceptance("field.floor", "slider", "Field height"),
  controlAcceptance("field.relief", "slider", "Relief"),
  {
    automated: true,
    automatedTestName: "floor field: view.orbit changes the cube field",
    browser: browserProof("view", "browser: orbit changes the cube field"),
    canvasHandle: {
      outputObservable: "Dragging the gizmo or the cube field changes the shared camera and the rendered cubes.",
      testId: "toolcraft-orientation-gizmo",
      writesTarget: "view.orbit",
    },
    componentType: "orientationGizmo",
    evidence: "rendered-pixels",
    expectedObservable: "Orbiting the field changes the camera pose and the rendered cubes.",
    fixture: "Default pastel cube field",
    id: "view.orbit",
    interactionId: "orbit-pose",
    kind: "canvas-handle",
    orientationGizmoCoverage: "all-required-orientation-gizmo-behavior",
    target: "view.orbit",
    userAction: "Drag the orientation gizmo, the cube field, and an empty canvas area.",
  },
  controlAcceptance("palette.hue", "rangeSlider", "Hue", { controlPartCoverage: "all-visible-parts" }),
  controlAcceptance("palette.saturation", "rangeSlider", "Saturation", { controlPartCoverage: "all-visible-parts" }),
  controlAcceptance("palette.lightness", "rangeSlider", "Lightness", { controlPartCoverage: "all-visible-parts" }),
  controlAcceptance("palette.patch", "slider", "Patch"),
  controlAcceptance("palette.pattern", "segmented", "Pattern", { optionCoverage: "each-visible-item" }),
  controlAcceptance("palette.seed", "slider", "Seed"),
  controlAcceptance("palette.shuffle", "actions", "Shuffle"),
  controlAcceptance("push.falloff", "segmented", "Falloff", { optionCoverage: "each-visible-item" }),
  controlAcceptance("push.radius", "slider", "Radius"),
  controlAcceptance("push.depth", "slider", "Depth"),
  controlAcceptance("push.stiffness", "slider", "Stiffness"),
  controlAcceptance("push.damping", "slider", "Damping"),
  controlAcceptance("push.mass", "slider", "Mass"),
  controlAcceptance("push.lag", "slider", "Lag"),
  controlAcceptance("light.azimuth", "slider", "Azimuth"),
  controlAcceptance("light.elevation", "slider", "Elevation"),
  controlAcceptance("light.shade", "slider", "Shade"),
  controlAcceptance("light.ambient", "slider", "Ambient"),
  controlAcceptance("light.sheen", "slider", "Sheen"),
  controlAcceptance("light.haze", "slider", "Haze"),
  controlAcceptance("export.includeBackground", "switch", "Background", {
    backgroundOutputCoverage: "all-required-background-output",
    browser: browserProof("export", "browser: background changes the cube field"),
  }),
  controlAcceptance("appearance.background", "color", "Floor color"),
  controlAcceptance("export.image.format", "select", "Format", {
    browser: browserProof("export", "browser: format changes the export", "extended-io"),
    evidence: "exported-bytes",
    expectedObservable: "PNG and JPG exports use the selected format.",
    optionCoverage: "each-visible-item",
    userAction: "Export PNG and JPG.",
  }),
  controlAcceptance("export.image.resolution", "select", "Resolution", {
    browser: browserProof("export", "browser: resolution changes the export", "extended-io"),
    evidence: "exported-bytes",
    expectedObservable: "The exported image long edge follows 2K, 4K, and 8K.",
    optionCoverage: "each-visible-item",
    userAction: "Export at each resolution.",
  }),
  controlAcceptance("actions.output", "panelActions", "Export PNG", {
    actionCoverage: ["export.png"],
    browser: browserProof("actions", "browser: export png writes the cube field", "extended-io"),
    evidence: "exported-bytes",
    expectedObservable: "Export PNG downloads the current cube field.",
    exportArtifactCoverage: "all-required-image-export-behavior",
    userAction: "Export PNG.",
  }),
  {
    automated: true,
    automatedTestName: "declares production reload coverage for the starter schema",
    browser: {
      budget: "extended-io",
      file: "e2e/app-persistence.spec.ts",
      testName: "browser: app restores exact canvas, values, and panel workspace slices after reload",
    },
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "Canvas size and zoom, their runtime values, and the moved and collapsed Controls workspace remain visibly restored after a real browser reload.",
    fixture: "starter runtime persisted workspace",
    id: "persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices: starterPersistenceSlices,
    target: "canvas.size.width",
    userAction: "Edit Canvas width and zoom, move and collapse Controls, wait for persistence, and reload the page.",
  },
  {
    automated: true,
    automatedTestName: "floor field: canvas.renderScale keeps backing pixels",
    browser: browserProof("canvas", "browser: render scale keeps backing pixels"),
    componentType: "canvas",
    evidence: "rendered-pixels",
    expectedObservable: "The selected resolution scale changes canvas backing pixels during interaction and at rest.",
    fixture: "Default pastel cube field",
    id: "canvas.render-scale",
    kind: "runtime",
    renderScaleCoverage: { kind: "selected-backing-pixels", states: ["interaction", "steady"] },
    target: "canvas.renderScale",
    userAction: "Change Resolution scale and inspect the cube canvas.",
  },
  {
    automated: true,
    automatedTestName: "floor field: infinity mode keeps the cube field",
    browser: browserProof("canvas", "browser: infinity mode keeps the cube field"),
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable: "Infinity canvas keeps the cube field, camera, and artboard size while the viewport boundary changes.",
    fixture: "Default pastel cube field",
    id: "canvas.infinity-mode",
    infinityCanvasCoverage: "mode-continuity-and-restoration",
    kind: "runtime",
    target: "canvas.infinity",
    userAction: "Turn Infinity canvas on, pan, reload, and undo.",
  },
  {
    automated: true,
    automatedTestName: "floor field: infinity export keeps the cube field",
    browser: browserProof("canvas", "browser: infinity export keeps the cube field", "extended-io"),
    componentType: "canvas",
    evidence: "exported-bytes",
    expectedObservable: "Infinity and finite PNG exports keep the visible cube field and its bounds.",
    fixture: "Default pastel cube field",
    id: "canvas.infinity-export",
    infinityCanvasCoverage: "scene-bounds-image-export",
    kind: "runtime",
    target: "actions.output",
    userAction: "Export PNG in finite and Infinity modes.",
  },
];

const parameter = (target: string, reason: string) => ({ reason, role: "parameter" as const, target });

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [
  {
    entity: "Cube field",
    entityId: "cube-field",
    finiteSelectors: [parameter("field.columns", "Count chooses a bounded number of cube columns.")],
    groupingReason: "Count, gap, bevel, height, relief, and orbit describe one cube field.",
    id: "squares",
    targets: ["view.orbit", "field.columns", "field.gap", "field.bevel", "field.floor", "field.relief"],
    title: "Squares",
  },
  {
    entity: "Color palette",
    entityId: "color-palette",
    finiteSelectors: [parameter("palette.pattern", "Pattern picks one of the four color arrangements.")],
    groupingReason: "Pattern, color ranges, patch size, seed, and shuffle describe one palette.",
    id: "palette",
    targets: [
      "palette.pattern",
      "palette.hue",
      "palette.saturation",
      "palette.lightness",
      "palette.patch",
      "palette.seed",
      "palette.shuffle",
    ],
    title: "Palette",
  },
  {
    entity: "Cursor push",
    entityId: "cursor-push",
    finiteSelectors: [parameter("push.falloff", "Falloff picks the cursor influence curve.")],
    groupingReason: "Falloff, radius, depth, and the spring terms describe one cursor press.",
    id: "push",
    targets: [
      "push.falloff",
      "push.radius",
      "push.depth",
      "push.stiffness",
      "push.damping",
      "push.mass",
      "push.lag",
    ],
    title: "Push",
  },
  {
    entity: "Scene light",
    entityId: "scene-light",
    finiteSelectors: [],
    groupingReason: "Direction, shade, ambient, sheen, and haze describe one light.",
    id: "light",
    targets: ["light.azimuth", "light.elevation", "light.shade", "light.ambient", "light.sheen", "light.haze"],
    title: "Light",
  },
  {
    entity: "Scene background",
    entityId: "scene-background",
    finiteSelectors: [parameter("export.includeBackground", "Include chooses whether the floor color is painted.")],
    groupingReason: "The floor switch and color describe the scene background.",
    id: "background",
    targets: ["export.includeBackground", "appearance.background"],
    title: "Background",
  },
  {
    entity: "Still export",
    entityId: "still-export",
    finiteSelectors: [
      parameter("export.image.format", "Format chooses PNG or JPG for the still export."),
      parameter("export.image.resolution", "Resolution chooses the exported long edge."),
    ],
    groupingReason: "Format and resolution describe one still-image export.",
    id: "runtime.image-export",
    targets: ["export.image.format", "export.image.resolution"],
    title: "Image Export",
  },
];
