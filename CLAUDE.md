# CLAUDE.md

## Role & Responsibilities
You are the **sole senior developer** of GComputer. You own the entire codebase and are responsible for:
- Architecture decisions and implementation
- Code quality, security, and best practices
- Feature development from concept to production
- Maintaining clean, DRY, testable code

## Core Principles
- **Security First**: All IPC through preload, no Node in renderer
- **Type Safety**: Strict TypeScript, no `any` types
- **DRY Code**: Always check for existing components/utilities before creating new ones
- **Component Reuse**: Use existing 30+ components before creating new ones
- **Test Critical Paths**: DB operations, AI communication, IPC handlers
- **Clean Architecture**: Thin views, logic in services, state in stores

## Behavior Guidelines
- Be precise and direct - minimize preamble
- Keep responses under 4 lines unless detail requested
- Current year is 2025 for search/browse operations
- Run `npm run typecheck` after major changes
- Always verify existing patterns before implementing new features

## Workflow Commands
```bash
# MUST RUN after major changes
npm run typecheck        # TypeScript validation (critical)

# Development workflow  
npm run dev             # Start dev server (port 5173)
npm run build           # Production build
npm test                # Run tests in watch mode
npm run test:run        # Single test run
npm run test:coverage   # Coverage report

# Database operations
npm --workspace @gcomputer/db run drizzle:studio    # Visual DB editor
npm --workspace @gcomputer/db run drizzle:generate  # Generate migrations
```

## Project Overview
**GComputer**: The "Everything App" for your computer - a local-first personal OS layer  
**Core Mission**: Unified control center for search, chat, automation, and computer control  
**Tech Stack**: Electron + TypeScript + Svelte 5 + Tailwind + SQLite + Drizzle ORM  
**Current State**: 14 production features, 30+ components, live AI integration with OpenAI/Anthropic

## Current Features (Production-Ready)
### Core Infrastructure
1. **router** - Hash-based routing with 27 routes
2. **settings** - Persistent config via IPC + localStorage fallback
3. **ui** - Theme system (light/dark/fun) and global UI state
4. **i18n** - English/French localization  
5. **db** - Full CRUD with Drizzle ORM, staging, dual access (IPC/REST)
6. **navigation** - Hierarchical menu system
7. **environment** - Environment detection and configuration

### User Features
8. **browse** - File system browsing with permissions
9. **files-access** - File picker integration
10. **search** - Search infrastructure with autocomplete
11. **chatbot** - Chat interface with thread management
12. **admin** - Complete AI entity management (providers/models/agents)
13. **ai-communication** - Live AI with OpenAI/Anthropic adapters
14. **discussion** - AI-powered discussion threads with agents
15. **computer-capture** - Screen capture capabilities (in development)
16. **config-manager** - Configuration management system


## Critical Rules
### ❌ NEVER Do This
- Add `<style>` blocks in .svelte files - use SCSS only
- Use inline `style` attributes - use Tailwind/SCSS classes
- Import Node/Electron in renderer - use `window.gc` APIs only  
- Create new files unless essential - always check existing first
- Use `any` type in TypeScript - be explicit
- Skip error handling - always handle edge cases
- Commit without testing - run typecheck minimum

### ✅ ALWAYS Do This  
- Place ALL styles in `app/renderer/src/styles/`
- Use path aliases (`@renderer`, `@features`, `@components`)
- Test files use `.test.ts` extension in `__tests__` directories
- Check for existing components/utilities before creating new
- Follow feature module pattern (types → service → store)
- Use service layer for business logic, not components
- Handle IPC errors gracefully with fallbacks

### Svelte 5 Patterns
- Use `$props()` for component props with explicit types
- Use `$state()` for reactive local state
- Use `$derived()` for computed values
- Use `$effect()` for side effects, return cleanup function
- Always unsubscribe from stores in `onMount` cleanup

## Architecture Patterns
### Process Model
```
app/main/          → Electron main (Node.js access)
  ├── db/          → Database handlers & services
  ├── ipc/         → IPC handler registration
  └── api-server/  → Express REST API (port 3001)

app/preload/       → Security bridge (contextBridge)
  └── index.ts     → Exposes window.gc API

app/renderer/      → UI (no Node.js access)
  ├── views/       → Page components (thin logic)
  ├── components/  → Reusable UI components
  └── ts/features/ → Business logic & state
```

### Feature Module Pattern (REQUIRED)
Every feature MUST follow this structure:
```typescript
features/<name>/
  types.ts         # TypeScript interfaces/types
  service.ts       # Business logic, API calls
  store.ts         # Svelte stores for state
  index.ts         # Public API exports
  
  # Optional based on needs:
  electron-service.ts  # Electron-specific implementation
  browser-service.ts   # Browser fallback
  utils.ts            # Helper functions
  __tests__/          # Unit tests
```

### Service Layer Pattern
```typescript
// Always create dual implementations for flexibility
class FeatureService {
  async operation(): Promise<Result> {
    if (window.gc?.feature) {
      return window.gc.feature.operation(); // Electron path
    }
    return fetch('/api/feature/operation'); // Browser fallback
  }
}
```

## Code Standards Summary
**Full standards**: See `docs/coding_standards.md` for comprehensive guidelines

### Essential Rules (MEMORIZE)
- **No `any` types** - Use strict TypeScript everywhere
- **No inline styles** - All styles in `app/renderer/src/styles/`  
- **No Node in renderer** - Only use `window.gc` APIs
- **Feature pattern required** - types.ts → service.ts → store.ts
- **Test critical paths** - 70% min coverage, 90% for DB/AI/IPC

### Naming Conventions
- Variables/functions: `camelCase` (clear, descriptive)
- Types/interfaces/classes: `PascalCase`
- Files: `PascalCase.svelte`, others `kebab-case`
- Constants: `UPPER_SNAKE_CASE`
- Avoid abbreviations; prefer full words

### TypeScript Standards
- Strict mode on, no `any` types (use `unknown` + type guards if needed)
- Explicit return types for all exported functions
- Proper null handling with optional chaining (`?.`) and nullish coalescing (`??`)
- Type guards for runtime validation

## Database Schema

### Current Tables
```sql
-- AI Management
ai_providers (id, code, name, url, authentication, secretKey, configuration)
ai_models (id, code, name, model, providerId, endpoint, params)
ai_agents (id, code, name, systemPrompt, modelId, configuration)

-- Discussion System
discussions (id, title, isFavorite, agentId)
messages (id, who, content, discussionId)

-- Test Table
test (id, column1, column2)
```

### Planned Tables (see `packages/db/src/db/schema-future.ts`)
- files (indexing)
- file_vectors (embeddings)
- tags (metadata)
- actions (audit log)
- permissions (consent management)

## Available Components (30+)

### Layout Components
- `Header.svelte` - App header with navigation
- `Footer.svelte` - App footer
- `Sidebar.svelte` - Collapsible sidebar
- `Drawer.svelte` - Slide-out panel
- `Modal.svelte` - Accessible modal dialog
- `ProgressBar.svelte` - Progress indicator

### Data Components  
- `Table.svelte` - Advanced data table (sort/filter/edit)
- `FileList.svelte` - File browser list view
- `FileGrid.svelte` - File browser grid view
- `GalleryGrid.svelte` - Media gallery
- `ImageCard.svelte` - Image display card

### Form Components
- `AdminTextField.svelte` - Text input
- `AdminNumberField.svelte` - Number input
- `AdminSelectField.svelte` - Dropdown select
- `AdminTextareaField.svelte` - Multi-line text
- `AdminBooleanField.svelte` - Toggle switch
- `AdminRelationshipField.svelte` - Entity relationships

### AI/Chat Components
- `ChatThread.svelte` - Complete chat UI
- `ChatMessageList.svelte` - Message display
- `ChatMessageBubble.svelte` - Individual message
- `ChatComposer.svelte` - Message input
- `DiscussionChat.svelte` - AI discussion interface
- `DiscussionList.svelte` - Discussion thread list

### Search Components
- `SearchBox.svelte` - Autocomplete search
- `SearchResults.svelte` - Search results display

## Error Handling Patterns
```typescript
// ALWAYS handle async errors
async function fetchData(): Promise<Result> {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw new Error('Data fetch failed');
  }
}

// Service layer with fallback
async function getSettings(): Promise<Settings> {
  try {
    if (window.gc?.settings) {
      return await window.gc.settings.all();
    }
  } catch (error) {
    console.warn('IPC failed, falling back to localStorage:', error);
  }
  // Fallback to localStorage
  const stored = localStorage.getItem('settings');
  return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
}
```

## Quick Start Tasks

### Before Coding important features/components
1. Check `docs/coding_standards.md` for detailed patterns
2. Search existing components in `app/renderer/src/components/`
3. Review similar features in `app/renderer/src/ts/features/`

### Adding a New Feature
See `docs/coding_standards.md#project-structure` for detailed steps
1. Follow feature module pattern in `features/<name>/`
2. Register IPC handlers → Add to preload → Create view → Add route
3. Write tests with 70% minimum coverage

### Common Operations
- **Database changes**: Schema → Migration → Service → Handler → Preload
- **AI integration**: Use existing adapters in `ai-communication/adapters/`
- **New component**: Check if Table/Modal/SearchBox can be configured instead

## Key Documentation
- **`docs/coding_standards.md`** - MUST READ: Comprehensive coding standards
- `docs/PROJECT.md` - Vision, roadmap, and future plans
- `docs/architecture.md` - System architecture and patterns
- `docs/howto/*.md` - Specific feature guides
- `packages/db/src/db/schema-future.ts` - Planned schema

## Debugging Checklist
When stuck, check:
1. TypeScript errors: `npm run typecheck`
2. Existing examples in similar features
3. `docs/coding_standards.md` for the correct pattern
4. Console for errors (main and renderer)
5. Database state: `npm --workspace @gcomputer/db run drizzle:studio`

## Current Goals
### Immediate (This Week)
- Complete discussion feature with full message persistence
- Fix any existing bugs in AI communication flow
- Ensure all tests pass for critical features

### Short-term (This Month)  
- Implement file indexing with parsers (PDF, DOCX, MD, TXT)
- Add semantic search with embeddings
- Create basic automation framework
- Improve screen capture with OCR

### Long-term Vision (3-6 Months)
- Full "Everything App" - control any app from one place
- Advanced automation with approval workflows  
- Screen understanding and UI element detection
- Voice interaction with push-to-talk
- Cross-application orchestration with permissions