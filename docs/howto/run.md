### Run the Project (macOS + Windows)

Prereqs: Installed per `docs/howto/install.md`.

---

### Development

Start the dev environment (Vite + esbuild + Electron):
```bash
npm run dev
```

Renderer dev URL: http://localhost:5173/

Behavior:
- Vite dev server serves the Svelte renderer on port 5173.
- esbuild watches and rebuilds Electron main and preload to `dist/`.
- Electron launches and loads the dev server.

If port 5173 is busy, stop the other process or change `server.port` in `vite.config.mts`.
Aliases are defined in `vite.config.mts` and `tsconfig.json` (must match).

---

### Type checking
```bash
npm run typecheck
```

---

### Production build (local)

Build main/preload bundles and renderer assets:
```bash
npm run build
```

Artifacts:
- Electron main: `dist/main/index.cjs`
- Preload: `dist/preload/index.cjs`
- Renderer: `dist/renderer/`

To run Electron against the built assets (no dev server):
```bash
cross-env VITE_DEV_SERVER_URL= electron dist/main/index.cjs
```

Note: Packaging into installers is covered in `package.md`.


