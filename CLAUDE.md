# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Behavior
You are a precise and straight to the point assistant.
We want to be efficient in our response to the user and keep our tokens for our thinking process.
No need to say "You're right", be clear and consice.

We are currently in 2025.

## Project Overview
GComputer is an Electron desktop application built with TypeScript, Svelte 5, and Tailwind CSS. The ultimate vision is a "local-first personal operating layer" that indexes, searches, and automates interactions with files and applications on the user's computer.

**Current state**: Production-ready Electron app with exceptional architecture - 12 features, 30+ sophisticated components, complete SCSS design system, robust type safety, production database with AI management system, and live AI communication capabilities.

**Long-term vision**: Everything-app for unified search, chat, screen understanding, and OS automation with granular permissions.

## Architecture

### Process Structure
- **Main** (`app/main/`): Electron main process, window lifecycle, settings persistence, IPC handlers
- **Preload** (`app/preload/`): Secure IPC bridge with whitelisted APIs exposed via `window.gc`
- **Renderer** (`app/renderer/`): Svelte 5 UI with feature-based organization

### Key Directories
```
app/
  main/           # Electron main process → dist/main/index.cjs
    main.ts       # Entry point, window management
    api-server.ts # Express REST API for browser access
    db.ts         # Database integration and operations
    db/
      handlers/   # IPC handlers for database operations
      services/   # Database service layer (shared with API)
      seeding.ts  # Default data seeding
      types.ts    # Database type definitions
    fs.ts         # File system IPC handlers
    menu.ts       # Native application menu
    settings.ts   # Settings persistence and IPC
    i18n/menu.ts  # Menu localization
  preload/        # IPC bridge → dist/preload/index.cjs
    index.ts      # Secure API exposure via contextBridge
    future-apis.ts # Planned API surface for future features
  renderer/
    src/
      views/      # 24 page-level Svelte components (organized by feature)
        admin/entity/llm/     # AI management views
        development/          # Development & testing views
        browse/, settings/    # Feature-specific views
      components/ # 30+ production-ready UI components
        admin/              # Complete admin system components
        audio/, chat/       # Specialized feature components
        search/             # Search interface components
      ts/
        features/ # 12 feature modules (types, service, store)
          ai-communication/ # NEW: Complete AI integration system
          admin/           # AI entity management
          [9 other features]
        i18n/     # Complete internationalization system
      styles/     # Complete SCSS design system (base/ and components/)

packages/db/      # Drizzle + sql.js workspace
  src/db/
    schema.ts     # Current production database schema
    schema-future.ts # Designed future schema for everything app
```

### Path Aliases
- `@renderer/*` → `app/renderer/src/*`
- `@views/*` → `app/renderer/src/views/*`
- `@ts/*` → `app/renderer/src/ts/*`
- `@features/*` → `app/renderer/src/ts/features/*`
- `@components/*` → `app/renderer/src/components/*`

## Development Commands

```bash
# Development (Vite + esbuild + Electron)
npm run dev

# Production build 
npm run build

# Type checking
npm run typecheck

# Rebuild native modules (required after npm install)
npm run rebuild:native

# Database tools (from workspace)
npm --workspace @gcomputer/db run drizzle:studio
npm --workspace @gcomputer/db run drizzle:generate

# Unit Testing
npm test                # Run tests in watch mode
npm run test:run        # Run tests once
npm run test:coverage   # Run with coverage report
npm run test:ui         # Open Vitest UI
```

## Testing Guidelines

### When to Run Tests
- **MANDATORY for major changes**: Architecture changes, new features, database schema changes, IPC modifications
- **OPTIONAL for minor changes**: Bug fixes, styling updates, documentation changes
- **ALWAYS before**: Creating pull requests, major releases

### Test Requirements
- Minimum 70% overall coverage for new code
- 90% coverage for critical business logic (database services, AI communication, settings)
- All tests must pass before merging

### Testing Commands
```bash
# Quick test run (use for minor changes)
npm run test:run

# Full test suite with coverage (use for major changes)
npm run test:coverage

# Interactive testing during development
npm test

# Visual test interface
npm run test:ui

## Code Conventions

### File Organization
- **Feature-first**: Logic organized in `@features/<name>/{types.ts, service.ts, store.ts}`
- **Thin views**: Svelte components focus on presentation, heavy logic goes in feature services
- **No styles in Svelte**: All styling in SCSS partials under `app/renderer/src/styles/`

### Naming
- Variables/functions: `camelCase`
- Types/interfaces/enums: `PascalCase`
- Svelte files: `PascalCase.svelte`
- Directories: `kebab-case`

### TypeScript
- Strict mode enabled, avoid `any`
- Explicit types for exported functions/interfaces
- Early returns over deep nesting

### Svelte 5 Patterns
- Use Svelte stores for shared state
- Explicit subscribe/unsubscribe (return unsubscribe in `onMount`)
- Path aliases for imports
- No `<style>` blocks or inline `style` attributes

### Security Constraints
- `contextIsolation: true`, `nodeIntegration: false`
- No Node/Electron imports in renderer - use preload-exposed APIs only
- IPC APIs exposed via `window.gc` namespace

## Database

- **Technology**: SQLite with sql.js (pure JavaScript) + Drizzle ORM in workspace package `@gcomputer/db`
- **Location**: `packages/db/data/gcomputer.db`
- **Schema**: `packages/db/src/db/schema.ts`
- **Migrations**: Auto-generated in `packages/db/drizzle/`
- **Access**: Via preload-exposed `window.gc.db` API
- **Cross-platform**: Works on Windows/macOS/Linux without native compilation

## Key Features

### 12 Production Features
1. **router** - Type-safe hash routing with 20+ routes, dev/prod gating
2. **settings** - Persistent config with IPC + localStorage fallback
3. **ui** - Global UI state (theme cycling: light/dark/fun, sidebar, modal)
4. **i18n** - Complete English/French localization system
5. **browse** - File browsing with path input and navigation
6. **files-access** - File picker integration with UI mapping
7. **db** - Full CRUD operations with staged editing
8. **search** - Search infrastructure with autocomplete suggestions
9. **chatbot** - Chat interface with thread management
10. **navigation** - Hierarchical menu system with NavTree
11. **admin** - Complete AI management system (providers, models, agents) with relationship fields
12. **ai-communication** - Live AI integration with OpenAI/Anthropic adapters, streaming, and conversation management

### 30 Production-Ready Components
**Core Layout (6)**: Header, Footer, Sidebar, Drawer, Modal, ProgressBar
**Data Display (6)**: Table (advanced: filtering, sorting, editing), FileList, FileGrid, GalleryGrid, ImageCard, ViewToggle  
**Navigation (1)**: NavTree (recursive, controlled/uncontrolled)
**Admin System (10)**: AdminCrud, AdminEntityManager, AdminFormModal, TestFormModal + 6 field components (AdminTextField, AdminNumberField, AdminSelectField, AdminRelationshipField, AdminTextareaField, AdminBooleanField)
**Specialized (7)**: AudioRecorder, ChatThread, ChatComposer, ChatMessageList, ChatMessageBubble, SearchBox, SearchResults

### Database Integration
- SQLite with sql.js (pure JavaScript) + Drizzle ORM in workspace package `@gcomputer/db`
- **Production Tables**: ai_providers, ai_models, ai_agents with relationship joins
- **Admin System**: Complete CRUD operations for AI entity management
- **Relationship Fields**: Type-safe handling of complex data relationships
- **Dual Access**: IPC via `window.gc.db.*` AND REST API at `localhost:3001/api/*`
- **Service Layer**: Shared business logic between Electron and browser access
- Cross-platform compatible without native compilation

### Admin System Architecture
The admin feature provides a complete, reusable pattern for entity management:

**Key Components**:
- **AdminEntityManager**: Master component for any entity CRUD operations
- **AdminFormModal**: Dynamic form generation based on field configuration
- **AdminRelationshipField**: Handles complex entity relationships with proper reactivity
- **Field Components**: Complete set of typed form fields (text, number, select, relationship, textarea, boolean)

**Relationship Field Pattern**:
```typescript
// Configuration for any relationship
{
  id: 'providerId',           // Field identifier
  type: 'relationship',       // Field type
  options: providerOptions,   // Available options array
  relationship: {
    entityKey: 'provider',    // Key for nested object (data.provider)
    valueField: 'id',         // Field to use as value (provider.id)
    labelField: 'name'        // Field to display (provider.name)
  }
}
```

**Features**:
- **Type Safety**: Full TypeScript support with generics
- **Data Extraction**: Handles both direct IDs and nested relationship objects
- **Reactive Binding**: Proper Svelte reactivity with automatic value synchronization
- **Reusable**: Same pattern works for providers↔models, models↔agents, users↔teams, etc.

### AI Communication System Architecture
The ai-communication feature provides live AI integration with external providers:

**Key Components**:
- **AICommunicationManager**: Central coordinator for AI interactions
- **Provider Adapters**: Specialized adapters for different AI services (OpenAI, Anthropic)
- **Message Formatting**: Standardized message preparation with system prompts
- **Streaming Support**: Real-time response streaming for enhanced user experience

**Provider Adapter Pattern**:
```typescript
interface ProviderAdapter {
  sendMessage(messages: AIMessage[], options: CommunicationOptions): Promise<AIResponse>
  streamMessage(messages: AIMessage[], options: CommunicationOptions): AsyncIterableIterator<StreamEvent>
  validateConfiguration(): Promise<boolean>
}
```

**Features**:
- **Multi-Provider Support**: OpenAI and Anthropic with extensible adapter architecture
- **Streaming Responses**: Real-time message streaming for better user experience
- **Configuration Management**: Dynamic provider/model configuration via admin system
- **Type Safety**: Complete TypeScript interfaces for all AI interactions
- **Error Handling**: Robust error handling with validation and fallbacks

## Development Notes

### Hot Reloading
- Renderer (Svelte/TS/SCSS): Automatic hot reload
- Main/Preload: Requires Electron restart (`Ctrl+C`, `npm run dev`)

### Build Process
- Main/Preload: esbuild with Node externals
- Renderer: Vite with Svelte plugin
- Output: `dist/main/index.cjs`, `dist/preload/index.cjs`, `dist/renderer/`

### Testing Database Access
```js
// In renderer DevTools console (Electron app)
window.gc.db.test.list()      // Should return array of test rows
window.gc.db.providers.list() // Should return array of AI providers
window.gc.db.models.list()    // Should return array of AI models with provider relationships
window.gc.db.agents.list()    // Should return array of AI agents with model relationships

// REST API endpoints (browser or external access)
fetch('http://localhost:3001/api/health')           // Health check
fetch('http://localhost:3001/api/test')            // Get test rows
fetch('http://localhost:3001/api/admin/providers') // Get AI providers
fetch('http://localhost:3001/api/admin/models')    // Get AI models
fetch('http://localhost:3001/api/admin/agents')    // Get AI agents
```

## Current Implementation Status

**✅ Implemented & Production-Ready**:
- Complete Electron security model with comprehensive IPC bridge
- 12 production features with consistent architecture patterns
- 30+ sophisticated UI components with rich APIs
- **Complete Admin System** with AI provider/model/agent management
- **Live AI Communication** with OpenAI/Anthropic integration, streaming support
- **Relationship Field Architecture** for complex data relationships
- **Express REST API** for browser-based database management
- **Shared Service Layer** between Electron and REST API
- Full settings persistence with main/renderer sync
- Type-safe hash routing with 20+ routes and dev/prod gating
- Complete theme system (light/dark/fun) with SCSS design tokens
- Full internationalization (English/French) with fallbacks
- **Production Database** with AI entities and relationship joins
- Complete SCSS design system with utility-first approach
- File system access with security validation
- Advanced Table component with filtering, sorting, inline editing
- Chat interface components with live AI integration
- Audio recording component with proper styling

**🎯 Immediate Next Capabilities**:
- **Enhanced AI Features**: Multi-turn conversations, conversation persistence, AI function calling
- **File Indexing**: Leverage existing database and file-access features for semantic search
- **Universal Search**: Extend current SearchBox component with AI-powered semantic search
- **User/Team Management**: Use established admin patterns and relationship fields
- **Screen Understanding**: Implement APIs designed in future-apis.ts
- **OS Automation**: Granular permissions system for computer control

## Requirements
- Node.js 20 LTS
- Platform: macOS, Windows (WSL2 recommended)

## Reference Documentation

**For specific task guidance, consult these files:**

### Architecture & Patterns
- `docs/architecture.md` - Complete technical architecture overview with current implementation details
- `docs/conventions.md` - Coding conventions and patterns for consistent development
- `docs/cursor-rules.md` - Human-readable development rules and best practices

### Component Development
- `docs/howto/components.md` - Component library usage and patterns
- `docs/howto/table.md` - Advanced Table component API and configuration
- `docs/howto/search.md` - Search component integration patterns
- `docs/howto/chatbot.md` - Chat interface components and AI integration

### Feature Development
- `docs/howto/local-files.md` - File system integration patterns
- `docs/howto/install.md` - Installation and setup instructions
- `docs/howto/run.md` - Development workflow and build processes
- `docs/howto/release.md` - Release and deployment procedures
- `packages/db/src/db/schema-future.ts` - Future database capabilities and planned schema
- `app/preload/future-apis.ts` - Planned IPC API surface for upcoming features

### Project Understanding
- `docs/project.md` - Complete vision and strategic roadmap for the "Everything App"
- `docs/DOC.md` - Comprehensive codebase analysis and quality assessment
- `docs/README.md` - Documentation index and overview
- `TODO.md` - Current recommendations and improvement opportunities

### Database & AI Integration
- `packages/db/src/db/schema.ts` - Current production database schema with AI tables
- `app/main/api-server.ts` - REST API endpoints for browser-based database access
- `app/renderer/src/ts/features/ai-communication/` - Complete AI integration system

**Key Insight**: The codebase represents exceptional software architecture (A+ grade) with minimal technical debt. Focus on leveraging existing patterns and components rather than creating new ones. All documentation is maintained and current with implementation.