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
        BrowseView.svelte
      ts/               # TypeScript entry + feature logic
        main.ts
        features/
          browse/
            types.ts
            service.ts
            store.ts
```

### Principles
- Views are thin: Svelte components focus on layout/interaction.
- Feature-first: each feature has `types`, `service` (IO/IPC), `store` (state).
- Shared components live in `components/`.
- Path aliases for clarity: `@views`, `@features`, `@ts`, `@components`, `@renderer`.

### Entry points
- Renderer: `app/renderer/index.html` → `/src/ts/main.ts` → mounts `@views/App.svelte`.
- Main: `app/main/main.ts` creates window, loads dev server or `dist/renderer/index.html`.
- Preload: `app/preload/index.ts` (IPC exposure; currently minimal).

### Build scripts
- `npm run dev`: Vite (renderer) + esbuild watch (main/preload) + Electron.
- `npm run build`: Builds main, preload, renderer to `dist/`.
- `npm run typecheck`: Strict TS type checking.


