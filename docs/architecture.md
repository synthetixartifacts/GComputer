## Architecture (concise)

### Stack
- Electron (main, preload, renderer)
- Svelte + Tailwind + SCSS (renderer UI)
- TypeScript everywhere
- Vite (renderer), esbuild (main/preload)

### High-level layout
```
app/
  main/        # Electron main process (bundled to dist/main)
  preload/     # Secure IPC bridge (bundled to dist/preload)
  renderer/    # UI
    index.html
    src/
      styles/           # global styles (Tailwind, SCSS)
      components/       # shared UI components
      views/            # page-level Svelte views
        App.svelte
        HomeView.svelte
        AboutView.svelte
        StyleguideView.svelte
      ts/               # TypeScript entry + feature logic
        main.ts
        features/
          browse/
            types.ts
            service.ts
            store.ts
          router/
            types.ts
            service.ts
            store.ts
          ui/
            service.ts
            store.ts
          settings/
            types.ts
            service.ts
            store.ts
          i18n/
            types.ts
            service.ts
            store.ts
            locales/
              en.json
              fr.json
```

### Principles
- Views are thin: Svelte components focus on layout/interaction.
- Feature-first: each feature has `types`, `service` (IO/IPC), `store` (state).
- Shared components live in `components/`.
- Path aliases for clarity: `@views`, `@features`, `@ts`, `@components`, `@renderer`.

### Entry points
- Renderer: `app/renderer/index.html` → `/src/ts/main.ts` → mounts `@views/App.svelte`.
- Main: `app/main/main.ts` creates window, loads dev server or `dist/renderer/index.html`.
- Preload: `app/preload/index.ts` (IPC exposure). Exposes `window.gc.settings` with `all/get/set/subscribe`.

### Settings & i18n
- Main process persists `settings.json` under `app.getPath('userData')` and exposes IPC handlers `settings:all/get/set`.
- Preload whitelists a `settings` API via `contextBridge`.
- Renderer `@features/settings` manages an `AppSettings` store and writes via preload.
- Renderer `@ts/i18n` provides `locale` and `t()` and loads catalogs from bundled JSON.
- Theme and locale are synchronized from settings; theme is applied to DOM via `data-theme` attribute.

### Routing
- Simple hash-based router implemented under `@features/router/`.
- Store: `currentRoute` with explicit subscribe/unsubscribe in views.
- Service: `initRouter`, `disposeRouter`, `navigate` update `location.hash`.

### Build scripts
- `npm run dev`: Vite (renderer) + esbuild watch (main/preload) + Electron.
- `npm run build`: Builds main, preload, renderer to `dist/`.
- `npm run typecheck`: Strict TS type checking.


