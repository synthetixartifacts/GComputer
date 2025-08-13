## Development Features Section — Local File Access Plan

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
