# Toolcraft App Agent Worklog

## Status

Mode: product

Floor Field is a pastel cube shader. The cursor presses cubes down and they spring back. Controls cover size, palette, push physics, light, and still export.

## Decisions

### Renderer

- Decision: Draw one instanced WebGL2 cube field on the CPU spring simulation.
- Reason: A fullscreen raymarch is too expensive while the user drags physics controls in software WebGL.
- Evidence: src/app/floor/floor-gl.ts, src/app/floor/floor-scene.tsx, and src/app/app-performance.ts.

### View Interaction

- Decision: Orbit the camera from the cube field and the orientation gizmo.
- Reason: The gallery photograph is an elevated view, and orbit lets the user inspect the cubes while the cursor still presses them.
- Evidence: appProductReadiness.viewInteraction and src/app/floor/floor-scene.tsx.

### Interaction Ownership

- Decision: Keep camera orbit on the canvas and keep physics, color, and size on panel controls.
- Reason: The cursor press is direct canvas behavior, while numeric experiments stay labeled in the panel.
- Evidence: appProductReadiness.interactionOwnership.

### Timeline

- Decision: Do not enable a timeline.
- Reason: The press and bounce are live pointer springs, not authored playback.
- Evidence: appSchema.panels.timeline is omitted and animationIntent is none.

### Layers

- Decision: Do not enable layers.
- Reason: The product is one cube field.
- Evidence: appSchema.panels.layers is omitted.

### Controls

- Decision: Group squares, palette, push, light, and background into separate sections, with count as the only product workload slider.
- Reason: Each group experiments with a different part of the same field.
- Evidence: src/app/floor/floor-controls.ts and src/app/app-acceptance-data.ts.

### Export

- Decision: Keep the default PNG and JPG still export and leave SVG and video unrequested.
- Reason: The requested output is a still shader image.
- Evidence: imageExportModule and appProductReadiness.exportIntent.

### Performance

- Decision: Use lifecycle-aware protected delivery verification.
- Reason: The runner chooses complete initial functional proof, exact ownership-derived later functional proof, or one request-backed targeted performance iteration; full certification remains operator-only.
- Evidence: npm run verify:delivery protected receipt.

## Decision Trail

### Delivery 1 - Product build

- Request: Build a Toolcraft app that paints a floor of colored squares, pushes them down under the cursor, and exposes physics, color, timing, and size controls.
- Task type: Schema, WebGL renderer, export, acceptance, and performance.
- User-visible result: A pastel cube field springs under the cursor and the panel edits its look and motion.
- Source/reference checked: The attached gallery photograph of a colored cube floor and the Toolcraft product contract.
- Reference inputs: None.
- Docs/contracts read: workflow.md, assembly-workflow.md, performance.md, renderer-technique.md, and app-cover.md.
- Contract rules applied: runtime-shell-required, output-export-required, and editable-output canvas sizing.
- View interaction intent: orbit, with the orientation gizmo and cube-field drag writing view.orbit.
- Interaction ownership: Canvas orbit owns the camera. Panel controls own cube, palette, push, light, and background values.
- Decision: Use an instanced WebGL2 cube shader, a CPU spring, and panel controls for the experiment.
- Alternatives rejected: A fixed camera, a timeline, DOM cells, and a fullscreen raymarch.
- State/output mapping: Schema values feed FloorScene and the still-image export renderer. Pointer pressure stays in the live simulation.
- Performance intent: ordinary-product-work
- Verification: Typecheck, acceptance coverage, and product behavior tests describe the cube field before delivery. One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Software WebGL can make the first export and orbit proofs slower than a hardware GPU.
- Cover: public/toolcraft/cover.png is a 1280×720 capture of the settled WebGL cube field on the floor color, with the controls panel excluded. Settings are in app-cover-state.json.

## Evidence

- Source reviewed: src/app/app-schema.ts, src/app/floor/floor-scene.tsx, and the gallery photograph.
- Contract applied: runtime-shell-required, performance-coverage-levels, and app-cover composition capture.

## Verification

Protected receipts own commands, selectors, measurements, and pass/fail evidence. Product behavior tests check column count, spring response, palette sampling, orbit matrices, and export settings.

## Risks

- Risk: The default camera is a three-quarter view so the cube gaps do not line up with the lens. Export corners stay transparent when the background is excluded.
