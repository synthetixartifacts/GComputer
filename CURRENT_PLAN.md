## Styleguide Additions Plan (New Sections)

Goal: Add missing sections our app will need, focusing on media and file browsing patterns. All demos must be styling-only or reusable components.

### New sections to add
- Media: image/gallery display (grid, aspect-ratio variants, captions, alt overlays, fullscreen/lightbox)
- Files: file explorer patterns (view toggle: list vs grid/thumb, selection highlight, basic metadata layout)
- Optional next (later):
  - Feedback: toasts/alerts/progress/loading states
  - Navigation: breadcrumbs/tabs/pagination for browsing contexts
  - Data display: badges/chips/avatars/cards

### Definition of done
- New sections appear under `test > styleguide` with clear titles and minimal deterministic demos
- Reusable, prop-driven components only; no app-specific logic
- a11y and i18n for all labels
- Typecheck and build pass

---

### Step-by-step (execute ONE at a time)

- [x] 1) Wire routes/menu/i18n and create stub views for Media and Files
- [x] 2) Media: reusable `GalleryGrid.svelte` + `ImageCard.svelte` using existing `Modal` for lightbox; demo with alt overlays and captions
- [x] 3) Files: reusable `FileList.svelte`, `FileGrid.svelte`, and `ViewToggle.svelte`; demo switching views with sample data
- [x] 4) a11y/i18n pass for new components; ensure keyboard and labels are correct
- [x] 5) Typecheck/build and quick QA of new pages

### Notes
- Keep edits lean; prefer props and slots over bespoke demo logic.
- Respect aliases (e.g., `@views/*`, `@components/*`).


