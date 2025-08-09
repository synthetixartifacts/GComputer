## Cursor Rules (human-readable)

Note: Legacy `.cursorrules` is replaced by `.cursor/rules/*.mdc`. Those MDC files are what Cursor reads.

High-signal guidance for AI assistants working in this repo.

### Scope & stack
- Electron + TypeScript + Svelte + Tailwind + Vite.
- Feature-first organization for renderer logic.

### Directories to know
- `app/main/`: Electron main process.
- `app/preload/`: IPC bridge (whitelist APIs only).
- `app/renderer/`: UI — entry `index.html` → `/src/ts/main.ts` → `@views/App.svelte`.
- `app/renderer/src/views/`: page-level Svelte files.
- `app/renderer/src/ts/features/`: feature modules (`types`, `service`, `store`).

### Aliases
- `@renderer/*` → `app/renderer/src/*`
- `@views/*` → `app/renderer/src/views/*`
- `@ts/*` → `app/renderer/src/ts/*`
- `@features/*` → `app/renderer/src/ts/features/*`
- `@components/*` → `app/renderer/src/components/*`

### Coding constraints
- TS strict; avoid `any` and deep nesting.
- Views keep minimal logic; heavy work goes in feature services/stores.
- Don’t enable `nodeIntegration` in renderer; use preload for IPC.
- Do not write styles in Svelte files. No `<style>` blocks and no inline `style="..."` attributes in `.svelte`.
- Place component/page styles in SCSS partials under `app/renderer/src/styles/` and import them via `app/renderer/src/styles/global.scss`.
- Use the existing categories: `base/` for tokens/layout, `components/` for reusable UI, and `pages/` if page-specific styling is required.

### When adding a feature
1) Create `app/renderer/src/ts/features/<name>/{types.ts,service.ts,store.ts}`.
2) Create a `views/<Name>View.svelte` to compose UI.
3) Wire the view in `App.svelte` (or router later).
4) Expose IO via preload if needed; never call Node APIs directly in views.

### Scripts
- Dev: `npm run dev`.
- Build: `npm run build`.
- Typecheck: `npm run typecheck`.


