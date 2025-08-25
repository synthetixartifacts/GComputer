# Repository Guidelines

## Project Structure & Modules
- Source: `app/main` (Electron main), `app/preload` (IPC bridge), `app/renderer` (Svelte 5 + TS UI).
- Database: `packages/db` (Drizzle ORM); migrations in `packages/db/drizzle/`.
- Tests: colocated `__tests__/` and `*.{test,spec}.ts`; setup in `test-setup.ts`.
- Outputs: `dist/` (build), `release/` (packaging). Docs/live guides in `docs/`.

## Dev, Build, Test
- `npm run dev`: Vite + esbuild + Electron with HMR.
- `npm run build`: bundle main/preload (esbuild) and renderer (Vite) to `dist/`.
- `npm run typecheck`: strict TS validation (run before PRs).
- Tests: `npm run test` | `test:watch` | `test:coverage`; scoped runs: `test:main`, `test:renderer`, `test:db`.
- DB tools: `npm --workspace @gcomputer/db run drizzle:studio|drizzle:generate`.
- Packaging: `npm run package:win|mac|linux` (after build or via `build:*`).

## Coding Style & Conventions
- TypeScript: no `any`; prefer explicit, narrow types; 2‑space indent; LF.
- Svelte 5: do not use `<style>` in components; place styles in `app/renderer/src/styles/` with Tailwind/SCSS.
- Feature pattern: types.ts → service.ts → store.ts (+ optional browser/electron services, utils, `__tests__/`).
- Imports: use path aliases (`@components`, `@features`, `@renderer`, `~/*`). Names: camelCase (vars/funcs), PascalCase (types/classes/components).

## Testing Guidelines
- Stack: Vitest (jsdom) + Svelte Testing Library; see `vitest.config.ts`.
- Patterns: `**/__tests__/**/*.{test,spec}.ts` and `**/*.{test,spec}.ts` beside code.
- Coverage: ≥70% global; aim for ≥90% on DB/AI/IPC critical paths.
- Examples: `npm run test:renderer`, `npm run test:main`, `npm run test:db`.

## Commit & Pull Requests
- Commits: imperative subject, optional scope (e.g., `feat(discussion): …`); reference issues.
- PRs: include description, linked issues, screenshots/GIFs for UI changes; ensure `typecheck` and tests pass.
- Reuse first: prefer existing components/utilities (see `docs/chat-components-usage.md`).

## Security & Configuration
- Renderer sandbox: no Node/Electron imports; use `window.gc` via preload APIs in `app/preload/api/*`.
- Secrets: keep in `.env`/`.env_secret`; `.env` is copied to `dist/` during build—never commit real secrets.
- Data: manage schema/migrations in `packages/db/drizzle/`; seed and examples in `packages/db/src/`.

## Architecture Notes
- Processes: main (Node/IPC/REST), preload (contextBridge), renderer (UI only). See `docs/architecture.md` for details.
