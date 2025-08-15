## Conventions (DRY + KISS)

### Code organization
- Feature-first under `app/renderer/src/ts/features/<feature>/` with `types.ts`, `service.ts`, `store.ts`.
- Views under `app/renderer/src/views/` compose features.
- Shared UI under `app/renderer/src/components/`.
- Global styles under `app/renderer/src/styles/`.
 - Use existing aliases: `@renderer`, `@views`, `@ts`, `@features`, `@components`.

### Naming
- Variables/functions: `camelCase` (clear, descriptive).
- Types/interfaces/enums: `PascalCase`.
- Svelte files: `PascalCase.svelte`.
- Folders: `kebab-case`.
- Avoid abbreviations; prefer full words.

### TypeScript
- Strict mode on. No `any` (except unavoidable boundaries).
- Exported functions/interfaces must be typed explicitly.
- Avoid deep nesting; use early returns and helper functions.

### Styles (SCSS)
- Place global tokens/utilities under `app/renderer/src/styles/base/`.
- Place reusable component styles under `app/renderer/src/styles/components/`.
- Do not write styles in Svelte files. Avoid inline `style` attributes.

### Svelte (Svelte 5)
- Keep views declarative; push IO/state to feature `service/store`.
- Prefer Svelte stores for shared state; explicitly subscribe/unsubscribe. When subscribing in `onMount`, return the unsubscribe function to avoid leaks.
- Use path aliases (`@renderer`, `@views`, `@features`, `@components`, `@ts`).

### Router
- Hash-based routing under `@features/router/` with a `Route` union type.
- Public API: `initRouter`, `disposeRouter`, `navigate`.
- Gate dev-only routes via `import.meta.env.DEV` (do not expose in production).

### Electron security
- `contextIsolation: true`, `nodeIntegration: false` in BrowserWindow.
- Only expose whitelisted APIs via preload.
- Never import Node/Electron modules in the renderer; use preload-exposed APIs.
 - Hide dev-only menu items in production (`process.env.NODE_ENV !== 'production'`).

### Commits & PRs
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.
- Small, focused PRs with a brief description.


