## Conventions (Quick Reference)

> **Note**: For comprehensive coding standards, see [`coding_standards.md`](./coding_standards.md)

### Core Principles
- **DRY (Don't Repeat Yourself)**: Always check for existing components/utilities before creating new ones
- **KISS (Keep It Simple)**: Prefer simple, readable solutions over complex abstractions
- **Security First**: Never expose Node.js to renderer, all IPC through preload
- **Type Safety**: Strict TypeScript everywhere, no `any` types
- **Component Reuse**: 30+ existing components - use them!

### Code Organization
- Feature-first under `app/renderer/src/ts/features/<feature>/` with:
  - `types.ts` - TypeScript interfaces and types
  - `service.ts` - Business logic and API calls
  - `store.ts` - Svelte stores for state management
  - `index.ts` - Public API exports (optional)
  - `electron-service.ts` - Electron-specific implementation (optional)
  - `browser-service.ts` - Browser fallback (optional)
- Views under `app/renderer/src/views/` - thin components that compose features
- Shared UI under `app/renderer/src/components/` - reusable components
- Global styles under `app/renderer/src/styles/` - SCSS only, no inline styles
- Use existing aliases: `@renderer`, `@views`, `@ts`, `@features`, `@components`

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

### Testing
- Test files in `__tests__/` directories with `.test.ts` extension
- Use Vitest for all testing needs
- Mock IPC calls in renderer tests
- Test critical paths: DB operations, AI communication, IPC handlers
- Aim for 70% coverage minimum, 90% for critical features

### Error Handling
- Always handle async errors with try/catch
- Provide user-friendly error messages via notification system
- Log errors to console in development
- Never expose internal errors or stack traces to users
- Use fallback values when appropriate

### Performance
- Use virtual scrolling for large lists (Table component has this)
- Debounce user inputs (search, filters) - 300ms default
- Lazy load heavy components and routes
- Keep views thin - business logic in services
- Clean up store subscriptions to prevent memory leaks

### Commits & PRs
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`
- Small, focused PRs with clear descriptions
- Run `npm run typecheck` before committing
- Include tests for new features
- Update documentation when changing architecture

### Code Review Checklist
- [ ] No `any` types used
- [ ] Existing components reused where possible
- [ ] Feature module pattern followed
- [ ] IPC handlers properly registered
- [ ] Error handling implemented
- [ ] Tests written for critical paths
- [ ] Documentation updated if needed
- [ ] TypeScript strict mode passes


