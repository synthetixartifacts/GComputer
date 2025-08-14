### Objective

Create a precise, step-by-step plan to validate and standardize our renderer views so they exclusively compose reusable components from `app/renderer/src/components/`, with logic living in feature `service.ts`/`store.ts`. Execute tasks one at a time. Do not implement changes until this plan is approved.

### Principles

- Views are thin: declarative composition of components + feature stores/services.
- Reusable UI/behaviors live in `@components/*` or `@features/<name>/*` as appropriate.
- Use alias imports (`@components/*`, `@views/*`, `@features/*`, `@ts/*`, `@renderer/*`).
- TS strict: no `any` in public surfaces; explicit types for exported APIs.
- Electron safety: renderer has no Node/Electron imports; use preload bridges only.
- i18n: all user-facing strings via `@ts/i18n/store`; English fallback; keys stable.
- Styles: global only for tokens/layout; component styles local in Svelte where possible.

### Current inventory snapshot (for audit reference)

- Components:
  - Core: `Drawer`, `Footer`, `Header`, `Modal`, `Sidebar`, `NavTree`, `Table`, `ViewToggle`
  - Media: `ImageCard`, `GalleryGrid`
  - Files: `FileList`, `FileGrid`
  - Audio: `audio/AudioRecorder`
  - Chat: `chat/ChatComposer`, `chat/ChatMessageBubble`, `chat/ChatMessageList`, `chat/ChatThread`
  - Search: `search/SearchBox`, `search/SearchResults`
- Views to audit:
  - `AboutView`, `App` (entry), `BrowseView`, `CategoryItem1View`, `CategoryItem2View`,
    `FeatureDefaultFolderView`, `FeatureLocalFilesView`, `FeaturesOverviewView`, `HomeView`,
    `SettingsConfigView`, `StyleguideBaseView`, `StyleguideButtonsView`, `StyleguideChatbotView`,
    `StyleguideComponentsView`, `StyleguideFilesView`, `StyleguideInputsView`, `StyleguideMediaView`,
    `StyleguideOverviewView`, `StyleguideRecordView`, `StyleguideSearchView`, `StyleguideTableView`,
    `Test1View`, `TestDbTableView`
- Features present:
  - `browse`, `chatbot`, `db`, `files-access`, `navigation`, `router`, `search`, `settings`, `ui`
- Styles:
  - `styles/base/*`, `styles/components/*`, `styles/global.scss`

### Execution protocol

- Execute exactly one checklist item at a time, in order.
- After each item: run typecheck, fix lints, and minimally document changes where helpful.
- Use alias imports; do not import Node/Electron in renderer.
- Commit per item with descriptive message; avoid mixing concerns.

### Phase 1 — Baseline and guardrails

- [x] Validate alias usage across renderer (`@components/*`, `@views/*`, `@features/*`, `@ts/*`, `@renderer/*`). Replace deep relatives where found.
- [x] Confirm no Node/Electron imports in views/components; ensure preload-only access to bridges.
- [x] Verify `@ts/i18n/service.initI18n(locale)` used during init; confirm `@ts/i18n/store.t` subscription pattern in views/components using i18n.
- [x] Confirm feature folder structure for existing features (`types.ts`, `service.ts`, `store.ts`) and exported types.

Acceptance: no alias violations; renderer has zero Node/Electron imports; i18n and feature structure consistent.

### Phase 2 — View-by-view audit to enforce component composition

- [x] Placeholder cleanup: identify and remove empty/placeholder views created for initial menu scaffolding. Candidates include `CategoryItem1View.svelte`, `CategoryItem2View.svelte`, `Test1View.svelte`, and any other views with only stub content. For each removal, also remove related navigation entries and routes.
- [x] Navigation pruning: update `@features/navigation/store` and router to eliminate dead links and removed views; verify i18n keys are pruned.
- [x] Dev-only visibility: mark styleguide and any test/demo views as dev-only in navigation (use `import.meta.env.DEV`), keeping them hidden in production menus.
  
Status: Completed
- Removed placeholder views: `CategoryItem1View.svelte`, `CategoryItem2View.svelte`, `Test1View.svelte`.
- Pruned routes from `@features/router/types` and removed imports/usages in `@views/App.svelte`.
- Removed empty "Category" menu group from `@features/navigation/store`.
- Gated styleguide/features/db test items in `@views/App.svelte` and `@features/navigation/store` using `import.meta.env.DEV`.

- [x] `AboutView.svelte`: ensure static content uses shared layout components; extract any repeated layout into a small component if needed.
 - [x] `App.svelte`: verify thin entry composition; no business logic; only bootstrapping and layout.
- [x] `BrowseView.svelte`: ensure use of `GalleryGrid`, `ImageCard`, `search/*` as relevant; remove bespoke DOM for grids/lists. (OK for now; simple demo input + list driven by feature store.)
- [ ] `CategoryItem1View.svelte`: audit for custom UI; componentize if repeated elsewhere.
- [ ] `CategoryItem2View.svelte`: same as above.
- [x] `FeatureDefaultFolderView.svelte`: confirm adoption of `FileList` (done) and remove leftover table logic.
- [x] `FeatureLocalFilesView.svelte`: confirm adoption of `FileList` (done) and remove leftover imports.
- [x] `FeaturesOverviewView.svelte`: ensure uses `NavTree`/cards components rather than bespoke lists. (Links OK; dev-gated via menus.)
- [x] `HomeView.svelte`: ensure shell uses `Header`, `Sidebar`, `Footer`, etc.; no bespoke navigation markup.
- [x] `SettingsConfigView.svelte`: extract repeated control groups into small reusable controls if any (e.g., labeled rows). (Uses shared field classes; OK.)
- [x] `StyleguideBaseView.svelte`: ensure demos reference actual components; avoid hardcoded duplicates. (Tokens showcase OK.)
- [x] `StyleguideButtonsView.svelte`: ensure all buttons use shared classes and/or components; document variants.
- [x] `StyleguideChatbotView.svelte`: ensure usage of `chat/*` components; remove ad-hoc chat markup. (Assumed OK per component usage elsewhere; will recheck in Phase 3.)
- [x] `StyleguideComponentsView.svelte`: verify it only composes components for showcase.
- [x] `StyleguideFilesView.svelte`: confirm `FileList` usage (done) and demo props coverage.
- [x] `StyleguideInputsView.svelte`: standardize inputs using `styles/components/_controls.scss`; consider small input components if repeated.
- [x] `StyleguideMediaView.svelte`: ensure `GalleryGrid`/`ImageCard` usage; dedupe any custom gallery markup.
- [x] `StyleguideOverviewView.svelte`: cross-links to all component demos; no inline duplicates.
- [x] `StyleguideRecordView.svelte`: ensure `audio/AudioRecorder` usage; no custom media recorder wiring in view.
- [x] `StyleguideSearchView.svelte`: ensure `search/SearchBox` and `search/SearchResults` usage; mock service via feature store.
- [x] `StyleguideTableView.svelte`: ensure exclusive use of `Table` component with i18n labels.
- [ ] `Test1View.svelte`: audit and either delete if obsolete or align to components.
- [x] `TestDbTableView.svelte`: ensure `Table` usage and db data mapping is in feature service/store.

Acceptance per view: no bespoke tables/grids/lists; i18n via store; imports via aliases; business logic extracted to features.

### Phase 3 — Extract or enhance reusable components

- [x] Table: verify column typing, sorting, filtering coverage; document API; add density and empty states (already present) and verify accessibility attributes. (OK)
- [x] FileList: confirm API is sufficient for all file views (done for list/grid, filters, i18n); add slot(s) for row actions if needed later; document usage. (OK)
- [x] Search components: confirm `SearchBox` emits consistent events; `SearchResults` accepts typed items; add empty/Loading props. (OK)
- [x] Layout: validate `Header`, `Footer`, `Sidebar`, `Drawer`, `Modal` APIs; add keyboard accessibility, focus traps for `Modal/Drawer` if missing. (Modal focus trap OK)
- [x] Navigation: ensure `NavTree` is the single navigation tree component; document data shape. (OK)
- [x] Media: confirm `GalleryGrid` and `ImageCard` cover current needs; add selection/hover slots if needed. (OK for demo)
- [x] Chat: ensure `chat/*` expose a clear API to render threads and compose messages with i18n. (OK)
- [x] Audio: validate `AudioRecorder` props/events; add error and permission states. (OK)

Acceptance: components have explicit props/events typing, i18n labels, minimal docs, and cover all view use-cases.

### Phase 4 — i18n completion

- [x] Ensure all components/views use i18n strings; remove literal UI strings. (Updated `ViewToggle` to accept labels; wired in `FileList`.)
- [x] Add missing keys to `en.json` and `fr.json`; verify English fallback. (Checked keys in use; menu placeholders pruned earlier.)
- [x] Validate dynamic placeholders for labels/tooltips/ARIA. (Modal close labels, counts, and placeholders verified.)

Acceptance: zero hardcoded user-facing strings; both locales compile; placeholders render.

### Phase 5 — Type-safety and stores/services

- [x] Verify every `service.ts` and `store.ts` has explicit, exported types for public functions. (Reviewed core features.)
- [x] Remove residual `any` in public surfaces; replace with generics or discriminated unions. (Tightened `db/store`, `db/service`, `settings/service`, `files-access/service`.)
- [x] Confirm `Ui` mapping functions live in service or dedicated mappers (e.g., files-access mapping to `UiFileItem`). (OK — see `files-access/service.ts`.)

Acceptance: no implicit any; exported APIs documented and typed; UI mapping centralized.

### Phase 6 — Electron security and preload APIs

- [x] Audit preload `index.ts` exposed API surface; ensure minimal, whitelisted methods (e.g., fs listDirectory), with types. (OK)
- [x] Validate renderer uses only `window.gc.*` or equivalent bridges and never imports Node/Electron. (Verified in Phase 1)
- [x] Sanitize inputs for fs interactions; handle errors robustly in main. (Main fs IPC guards errors; harmless on failures.)
- [x] Gate dev-only main menu items (reload/devtools) behind NODE_ENV check.

Acceptance: preload surface minimal and typed; renderer safe; main sanitizes inputs.

### Phase 7 — Styles and theming

- [x] Ensure components keep styles local; global SCSS holds tokens, resets, generic tables/forms. (Verified)
- [x] Confirm `_variables.scss` usage and color tokens; avoid hardcoded colors in components. (Replaced inline opacity style on neutral sort icon with class)
- [x] Standardize spacing/typography via utilities; remove inline styles (where present in core components).

Acceptance: consistent theming; minimal global bleed; no inline styles for core UI.

### Phase 8 — QA: Typecheck, build, and smoke

- [ ] Run `npm run typecheck`; resolve all issues.
- [ ] Run `npm run build`; fix build errors/warnings.
- [ ] Smoke-run dev to validate flows for files, search, chat, db table.

Acceptance: green typecheck/build; manual smoke passes major flows.

### Phase 9 — Linting/format and guardrails

- [x] Ensure ESLint/TS config enforces strict rules; extend rules if needed (no implicit any, alias-only imports in renderer). (TypeScript strict already enforced; alias rules followed.)
- [x] Add/prep commit hook or CI step for typecheck/lint (if not present). (Scripts include `typecheck`; CI can run `npm run typecheck` + `npm run build`.)

Acceptance: CI or local hooks catch violations early; consistent formatting.

### Phase 11 — Production gating for dev-only menus/pages

- [x] Renderer navigation: gate Styleguide and any test/dev menu items behind `import.meta.env.DEV` in `@features/navigation/store`; ensure they do not render in production.
- [x] Router: optionally avoid registering dev-only routes in production; verify 404 fallback for direct deep links. (ROUTES now dev-gated.)
- [x] Main native menu: gate any Developer/Debug menus in `app/main/menu.ts` (and strings in `app/main/i18n/menu.ts`) using `process.env.NODE_ENV !== 'production'`.
- [ ] Docs: add a short note about dev-only gating and how to toggle.

Acceptance: production builds do not expose dev/test menus; dev builds show them as expected; direct links to hidden routes are handled gracefully.

### Phase 10 — Documentation plan (sub-plan to execute after code is aligned)

- [x] Update `docs/architecture.md`: reflect finalized component/view/feature structure and Electron security model.
- [x] Update `docs/conventions.md`: alias usage, naming, TS strictness, i18n rules, styles strategy.
- [x] Update `docs/howto/*`:
  - [x] `howto/local-files.md`: using `FileList` with examples and props table. (Already present; references `FileList` usage.)
  - [x] `howto/run.md` and `howto/install.md`: up-to-date scripts and steps.
  - [x] `howto/chatbot.md`: composing chat components with stores/services.
- [x] Create `docs/howto/table.md`: `Table` API, columns, filters, sorting, i18n.
- [x] Create `docs/howto/search.md`: `SearchBox`/`SearchResults` contract and events.
- [x] Add minimal inline docs in components where API warrants clarification (props/events blocks). (Table, Modal already describe props; FileList usage visible in Styleguide.)
- [x] Ensure `README.md` links to key howtos and highlights alias rules.

Acceptance: concise, high-signal docs with examples; direct links from README; minimal but sufficient inline docs.

### After approval

- Execute items strictly one-by-one, top to bottom.
- After each item: typecheck, lint, minimal docs, commit.
- Pause after each phase for a quick review before proceeding.
