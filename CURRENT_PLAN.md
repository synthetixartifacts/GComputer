## Styleguide Master Plan

Purpose: Create a complete, clean, and reusable styleguide under `test > styleguide`, organized into clear sections. Each example must be styling-only or a reusable component demo.

### Current sections (as-is)
- Base: `@views/StyleguideView.svelte` (typography, inline icons)
- Inputs: `@views/StyleguideInputsView.svelte`
- Buttons: `@views/StyleguideButtonsView.svelte`
- Table: `@views/StyleguideTableView.svelte`
- Components: `@views/StyleguideComponentsView.svelte` (Modal, Drawer demos)

### High-level gaps to address
- Foundations: No explicit colors/tokens, spacing scale, radii, shadows, motion examples
- Inputs: Missing checkbox, radio, switch/toggle, number, range, date/time, file
- Buttons: Missing sizes (btn--sm is referenced but not styled), danger/destructive, loading state
- Table: Only base demo; no density variants, empty state, slot patterns showcased
- Components: Missing Header/Footer/Sidebar/NavTree demos and usage guidelines; NavTree coupled to global store (consider prop-driven API)
- Overview: `test.styleguide` duplicates Base; add an Overview page with links to sub-sections
- Accessibility/i18n: Ensure ARIA attributes, focus management (Modal), and keys for all labels

### Definition of done
- All sections present, discoverable from Overview
- Examples are minimal, deterministic, and do not include ad hoc logic that should live in components
- All components demoed are reusable and prop-driven (no hidden global coupling in examples)
- Typecheck passes; no linter errors introduced

---

### Step-by-step plan (execute ONE at a time)

- [x] 1) Buttons polish: add size utilities (`.btn--sm`, `.btn--lg`) and standardize icon close buttons (Drawer close = `btn btn--secondary gc-icon-btn` to match Modal). No UI behavior changes.
- [x] 2) Restructure Base vs Overview:
  - Rename `StyleguideView.svelte` → `StyleguideBaseView.svelte`
  - Create `StyleguideOverviewView.svelte` linking to all subpages
  - Update routes and menu: `test.styleguide` → Overview, `test.styleguide.base` → Base
- [x] 3) Foundations page enrichments (in Base view): add tokens showcase (colors, spacing scale, radii, shadows, motion), with small swatches/blocks only
- [x] 4) Inputs coverage: add checkbox, radio, switch/toggle, number, range, date/time, file; unify invalid/disabled states using existing `.field` patterns
- [x] 5) Buttons coverage: add `btn--danger` variant and loading state example; ensure accessible labels for icon-only buttons
- [ ] 6) Table demos: add compact density variant, empty state example, and a header-actions slot sample
- [ ] 7) Components demos: add Header/Footer/Sidebar/NavTree samples; document props; avoid coupling in demos
- [ ] 8) NavTree API review: allow controlled `currentRoute` and `expanded` via props (keep stores behind a thin adapter); update demo to prop-driven instance
- [ ] 9) Accessibility pass: Modal focus trap and `aria-labelledby`; Drawer `aria-labelledby`; audit tab order and focus-visible styles
- [ ] 10) i18n pass: add missing keys for new demos/labels in `en.json` and `fr.json`
- [ ] 11) Light doc notes: short usage notes in component files where helpful (no long docs)
- [ ] 12) Typecheck/build verification and quick manual QA through each subpage

### Notes
- Keep edits lean; prefer props and slots over bespoke demo logic.
- Respect aliases (e.g., `@views/*`, `@components/*`).


