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
- **Component Reuse**: Use existing 38+ components before creating new ones
- **Test Critical Paths**: DB operations, AI communication, IPC handlers
- **Clean Architecture**: Thin views, logic in services, state in stores

## Behavior Guidelines
- Be precise and direct - minimize preamble
- Keep responses under 4 lines unless detail requested
- Current year is 2025 for search/browse operations
- Run `npm run typecheck` after major changes
- Always verify existing patterns before implementing new features

## Project Overview
**GComputer**: The "Everything App" for your computer - a local-first personal OS layer  
**Core Mission**: Unified control center for search, chat, automation, and computer control  
**Tech Stack**: Electron + TypeScript + Svelte 5 + Tailwind + SQLite + Drizzle ORM  
**Current State**: 17 production features, 38+ components, live AI integration with OpenAI/Anthropic

## Current Features (Production-Ready)

### Core Infrastructure (8)
1. **router** - Hash-based routing with 27 routes
2. **settings** - Persistent config via IPC + localStorage fallback
3. **ui** - Theme system (light/dark/fun) and global UI state
4. **i18n** - English/French localization  
5. **db** - Full CRUD with Drizzle ORM, staging, dual access (IPC/REST)
6. **navigation** - Hierarchical menu system
7. **environment** - Environment detection and configuration
8. **config** - Application configuration system

### User Features (9)
9. **browse** - File system browsing with permissions
10. **files-access** - File picker integration
11. **search** - Search infrastructure with autocomplete
12. **chatbot** - Chat interface with thread management
13. **admin** - Complete AI entity management (providers/models/agents)
14. **ai-communication** - Live AI with OpenAI/Anthropic adapters
15. **discussion** - AI-powered discussion threads with agents
16. **computer-capture** - Screen capture capabilities
17. **config-manager** - Configuration management system
18. **context-menu** - Context menu system

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

### Quick Rules
- **No `any` types** - Use strict TypeScript everywhere
- **No inline styles** - All styles in `app/renderer/src/styles/`  
- **No Node in renderer** - Only use `window.gc` APIs
- **Feature pattern required** - types.ts → service.ts → store.ts
- **Test critical paths** - 70% min coverage, 90% for DB/AI/IPC

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

## Available Components (38+)

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

## Essential Commands

```bash
# Development
npm run dev              # Start dev server (port 5173)
npm run build            # Production build
npm run typecheck        # TypeScript validation

# Testing
npm test                 # Watch mode
npm run test:run         # Single run
npm run test:coverage    # Coverage report
npm run test:main        # Test main process
npm run test:renderer    # Test renderer

# Database
npm --workspace @gcomputer/db run drizzle:studio    # Visual DB editor
npm --workspace @gcomputer/db run drizzle:generate  # Generate migrations

# Packaging
npm run package:win      # Windows installer
npm run package:mac      # macOS app
npm run package:linux    # Linux AppImage
```

## Quick Start Tasks

### Before Coding
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
- **`docs/coding_standards.md`** - MUST READ: Comprehensive coding standards and patterns
- **`docs/DOC.md`** - Master documentation and single source of truth
- **`docs/PROJECT.md`** - Vision, roadmap, and Everything App roadmap
- **`docs/architecture.md`** - Detailed system architecture and component patterns
- **`docs/README.md`** - Documentation index and quick reference
- `docs/howto/*.md` - Feature-specific implementation guides
- `packages/db/src/db/schema-future.ts` - Planned database schema

### Documentation Usage
These documentation files provide comprehensive coverage of the codebase:
- Use `docs/DOC.md` for high-level project understanding and current state
- Reference `docs/coding_standards.md` for implementation patterns and requirements  
- Check `docs/architecture.md` for detailed technical architecture
- Browse `docs/howto/*.md` for specific feature implementation examples
- Review `docs/PROJECT.md` for future vision and roadmap planning

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
