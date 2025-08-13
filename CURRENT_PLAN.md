## Development Features Section — Local File Access Plan
---

## Table-based File Listing Enhancements Plan

Goal: Use the native reusable `@components/Table.svelte` for the file list (list view), adding configurable sorting and filtering per column with visual sort indicators.

### Findings
- `@components/Table.svelte` exists and is used by `StyleguideTableView`. It supports editing, filtering, actions. No built-in sorting yet and filters are always text inputs.
- We need: per-column sortable/filterable flags, filter types (text/number/date/select), and sort indicators.

### Step-by-step (execute ONE at a time)
- [x] 1) Extend `@components/Table.svelte` to support sorting (asc/desc/none) with icons and ARIA `aria-sort`. Add per-column config: `sortable`, `filterable`, `filterType`, `filterOptions`, `sortAccessor`. Keep defaults: sorting enabled, filtering enabled, text filter.
- [x] 2) Replace FileList list rendering to use `@components/Table.svelte` for files: columns [Name (string), Size (number), Type (string), Modified (date)]. Configure appropriate filter types and sort accessors (sizeBytes, lastModified). Hide actions column.
- [x] 3) Add file-list-specific mapping into `@features/files-access/service.ts` to provide raw values (sizeBytes, lastModified) alongside formatted strings, and update the view to pass both raw and display values correctly to the table component.
- [x] 4) Add simple column filter presets for Size (select: <1MB, 1–50MB, 50–500MB, 500MB–1GB, >1GB) and Modified (date input), and wire filtering in the view using table `filterChange` event.
- [ ] 5) Typecheck/build; adjust styles if needed to align sort icons with table header spacing.

---

## Table Filters UX Improvements Plan

Goal: Add a default "Clear filters" control and per-column clear buttons to the reusable table component so all usages benefit.

### Step-by-step (execute ONE at a time)
- [ ] 1) Enhance `@components/Table.svelte`:
  - Add a toolbar "Clear filters" button (enabled only when any filter is active), emits `clearAllFilters` event.
  - Add per-column clear button (small "X") beside each filter control that emits `filterChange` with empty value for that column.
  - Extend `labels` to include `clearFilters` and `clearColumnFilter`. Keep sensible defaults.
  - Keep component controlled (parents own `filters`).
- [ ] 2) Wire usages to handle `clearAllFilters`:
  - `@views/StyleguideTableView.svelte`: reset `filters = {}` and re-run local filtering.
  - `@views/StyleguideFilesView.svelte`: reset `filters = {}`.
  - `@views/FeatureLocalFilesView.svelte`: reset `filters = {}`.
- [ ] 3) i18n: add `components.table.clearFilters` and `components.table.clearFilter` in EN/FR and pass via `labels` where used in styleguide demos.
- [ ] 4) Typecheck/build; quick visual pass for button spacing in toolbar and header filters.

### Definition of done
- Table renders a default Clear filters control, enabled only when filters are active.
- Each filter cell shows a clear X when a value is set; clicking it clears that column filter.
- All current usages handle `clearAllFilters` and labels are localized in demos.

### Definition of done
- File list list-view uses `@components/Table.svelte` with working asc/desc sorting and default filters per column.
- Size and Modified columns support correct sorting using raw values.
- Filters operate according to configured types and presets.


Goal: Create a new Development → Features section to prototype, review, and test app features. First feature: local file access via a browser folder picker, rendering selected folder contents using existing file UI components. Also add a placeholder page for a specific-location view (TBD).

### Scope (v1)
- New menu group under Development: Features
- Routes and views for:
  - Features overview
  - Local files (folder picker) — initial stub followed by listing implementation
  - Specific location (TBD)
- Use only browser capabilities (no Node/Electron in renderer). Later iterations may add preload-bridged native dialogs.

### Architecture decisions
- Follow feature-first structure; views thin, logic in `@features/*` services/stores.
- For v1 listing, use `<input type="file" webkitdirectory>` to select a folder and enumerate files via the File API.
- Reuse `@components/FileList.svelte` and `@components/FileGrid.svelte` with a `ViewToggle`.
- Add i18n keys for menu and pages (EN/FR).

---

### Step-by-step (execute ONE at a time)

- [ ] 1) Scaffold Features section: add routes (`test.features`, `test.features.local-files`, `test.features.location-tbd`), menu items (EN/FR), and views (`FeaturesOverviewView`, `FeatureLocalFilesView` stub, `FeatureLocationTbdView` stub). Wire in `App.svelte`.
- [ ] 2) Implement Local Files folder picker UI: render the folder chooser in `FeatureLocalFilesView` and show basic selected count.
- [x] 2) Implement Local Files folder picker UI: render the folder chooser in `FeatureLocalFilesView` and show basic selected count.
- [x] 3) Create feature module `@features/files-access/{types.ts, service.ts, store.ts}`; move file listing logic into service/store, expose typed items for UI.
- [x] 4) Render selected folder contents using `ViewToggle` + `FileList`/`FileGrid`; compute size and modified date; handle empty state.
- [x] 5) Add i18n strings for page headings, descriptions, actions (EN/FR); ensure accessibility labels.
- [x] 6) Add placeholder content for the Specific Location page and note next steps (e.g., preload IPC for native dialogs and directory bookmarks).
- [x] 7) Typecheck/build; fix any issues.
- [x] 8) Document usage briefly in `docs/howto` (folder picker limitations, security notes).

### Definition of done (v1)
- Development → Features appears in the menu with Local files and Specific location items.
- Navigating to Local files shows the page and (later steps) lists selected folder contents using existing file UI.
- No Node/Electron APIs used in renderer; complies with preload security model.
- `npm run typecheck` passes.

### Future iterations (not in v1)
- Preload IPC to open native directory dialogs and read directories via Node.
- Permissioned scopes for directories; persisted folder bookmarks in settings.
- Grouping by directories and previews for supported media types.
