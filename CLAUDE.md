# CLAUDE.md

## Behavior
- Be precise and direct - minimize preamble
- Keep responses under 4 lines unless detail requested
- Current year is 2025 for search/browse operations

## Quick Start

### Essential Commands
```bash
npm run dev              # Start development
npm run build            # Production build  
npm run typecheck        # Check types
npm test                 # Watch mode tests
npm run test:run         # Single test run
npm run test:coverage    # Coverage report
```

### Linting & Type Checking
- Run `npm run lint` and `npm run typecheck` after completing any task
- If commands not found, ask user and suggest adding to CLAUDE.md

## Project Context
**GComputer**: Electron + TypeScript + Svelte 5 + Tailwind desktop app  
**Vision**: Local-first personal OS layer for file/app indexing, search, and automation  
**Status**: Production-ready with 12 features, 30+ components, AI integration

## Critical Rules

### ❌ NEVER Do This
- Add `<style>` blocks in .svelte files - use SCSS only
- Use inline `style` attributes - use SCSS classes
- Import Node/Electron in renderer - use `window.gc` APIs only  
- Create files unless essential - prefer editing existing
- Create docs/README unless explicitly requested
- Commit without user asking explicitly

### ✅ ALWAYS Do This  
- Place ALL styles in `app/renderer/src/styles/`
- Use path aliases (`@renderer`, `@features`, `@components`)
- Test files use `.test.ts` extension in `__tests__` directories
- Run tests before PRs and major releases
- Use existing patterns and components

## Architecture

### Process Structure
- `app/main/` → Electron main process (dist/main/index.cjs)
- `app/preload/` → Secure IPC bridge via `window.gc`
- `app/renderer/` → Svelte UI with feature modules

### Feature Module Pattern
```
@features/<name>/
  types.ts      # TypeScript interfaces
  service.ts    # Business logic
  store.ts      # Svelte stores
```

### Database Access
```js
// Electron (via IPC)
window.gc.db.providers.list()

// Browser (via REST API)  
fetch('http://localhost:3001/api/admin/providers')
```

## Code Standards

### Naming Conventions
- `camelCase` - variables, functions
- `PascalCase` - types, interfaces, Svelte files
- `kebab-case` - directories
- `.test.ts` - test files in `__tests__` folders

### TypeScript
- Strict mode - no `any`
- Explicit return types for exports
- Early returns over deep nesting

### Svelte 5
- Svelte stores for shared state
- Explicit subscribe/unsubscribe in `onMount`
- Heavy logic in feature services, not components

## Testing

### Coverage Requirements
- 70% minimum for new code
- 90% for critical logic (DB, AI, settings)

### When to Test
- **Required**: Architecture changes, new features, DB/IPC changes
- **Optional**: Bug fixes, styling, documentation
- **Always**: Before PRs and releases

## Key Features Available

### Production Features (12)
1. `router` - Type-safe hash routing
2. `settings` - Persistent config with IPC
3. `ui` - Theme system (light/dark/fun)
4. `i18n` - English/French localization
5. `browse` - File browsing
6. `files-access` - File picker
7. `db` - Full CRUD with staging
8. `search` - Autocomplete search
9. `chatbot` - Chat interface
10. `navigation` - Menu system
11. `admin` - AI entity management
12. `ai-communication` - OpenAI/Anthropic integration

### Components (30+)
- **Layout**: Header, Footer, Sidebar, Drawer, Modal, ProgressBar
- **Data**: Table (filtering/sorting/editing), FileList, FileGrid
- **Admin**: Complete CRUD system with 6 field types
- **Chat**: Full chat UI with AI integration
- **Search**: SearchBox with autocomplete

## AI Integration

### Provider Adapter Pattern
```typescript
interface ProviderAdapter {
  sendMessage(messages: AIMessage[], options): Promise<AIResponse>
  streamMessage(messages: AIMessage[], options): AsyncIterableIterator<StreamEvent>
  validateConfiguration(): Promise<boolean>
}
```

### Admin System Pattern
```typescript
// Relationship field config
{
  id: 'providerId',
  type: 'relationship',
  options: providerOptions,
  relationship: {
    entityKey: 'provider',
    valueField: 'id',
    labelField: 'name'
  }
}
```

## Database
- **Tech**: SQLite + sql.js + Drizzle ORM
- **Location**: `packages/db/data/gcomputer.db`
- **Schema**: `packages/db/src/db/schema.ts`
- **Tables**: ai_providers, ai_models, ai_agents

## Reference Docs
- `docs/architecture.md` - Technical overview
- `docs/conventions.md` - Coding patterns
- `docs/howto/*.md` - Feature guides
- `packages/db/src/db/schema-future.ts` - Planned schema
- `app/preload/future-apis.ts` - Planned APIs