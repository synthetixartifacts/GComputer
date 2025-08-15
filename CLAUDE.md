# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GComputer is an Electron desktop application built with TypeScript, Svelte 5, and Tailwind CSS. The ultimate vision is a "local-first personal operating layer" that indexes, searches, and automates interactions with files and applications on the user's computer.

**Current state**: Production-ready Electron app with exceptional architecture - 10 features, 16 sophisticated components, complete SCSS design system, robust type safety, and database foundation with future schema designed.

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
    db.ts         # Database integration and operations
    fs.ts         # File system IPC handlers
    menu.ts       # Native application menu
    settings.ts   # Settings persistence and IPC
    i18n/menu.ts  # Menu localization
  preload/        # IPC bridge → dist/preload/index.cjs
    index.ts      # Secure API exposure via contextBridge
    future-apis.ts # Planned API surface for future features
  renderer/
    src/
      views/      # 21 page-level Svelte components (thin composition)
      components/ # 16 production-ready UI components
      ts/
        features/ # 10 feature modules (types, service, store)
        i18n/     # Complete internationalization system
      styles/     # Complete SCSS design system (base/ and components/)

packages/db/      # Drizzle + sql.js workspace
  src/db/
    schema.ts     # Current database schema
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
```

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

### 10 Production Features
1. **router** - Type-safe hash routing with 19 routes, dev/prod gating
2. **settings** - Persistent config with IPC + localStorage fallback
3. **ui** - Global UI state (theme cycling: light/dark/fun, sidebar, modal)
4. **i18n** - Complete English/French localization system
5. **browse** - File browsing with path input and navigation
6. **files-access** - File picker integration with UI mapping
7. **db** - Full CRUD operations with staged editing
8. **search** - Search infrastructure with autocomplete suggestions
9. **chatbot** - Chat interface with thread management
10. **navigation** - Hierarchical menu system with NavTree

### 16 Production-Ready Components
**Core Layout (6)**: Header, Footer, Sidebar, Drawer, Modal, ProgressBar
**Data Display (6)**: Table (advanced: filtering, sorting, editing), FileList, FileGrid, GalleryGrid, ImageCard, ViewToggle  
**Navigation (1)**: NavTree (recursive, controlled/uncontrolled)
**Specialized (3 categories)**: audio/AudioRecorder, chat/* (4 components), search/* (2 components)

### Database Integration
- SQLite with sql.js (pure JavaScript) + Drizzle ORM in workspace package `@gcomputer/db`
- Current: Test table with full CRUD operations
- Future: Complete schema designed for file indexing, embeddings, automation
- IPC: Exposed via `window.gc.db.test.*`
- Cross-platform compatible without native compilation

## Development Notes

### Hot Reloading
- Renderer (Svelte/TS/SCSS): Automatic hot reload
- Main/Preload: Requires Electron restart (`Ctrl+C`, `npm run dev`)

### Build Process
- Main/Preload: esbuild with Node externals
- Renderer: Vite with Svelte plugin
- Output: `dist/main/index.cjs`, `dist/preload/index.cjs`, `dist/renderer/`

### Testing Database IPC
```js
// In renderer DevTools console
window.gc.db.test.list() // Should return array of test rows
```

## Current Implementation Status

**✅ Implemented & Production-Ready**:
- Complete Electron security model with comprehensive IPC bridge
- 10 production features with consistent architecture patterns
- 16 sophisticated UI components with rich APIs
- Full settings persistence with main/renderer sync
- Type-safe hash routing with 19 routes and dev/prod gating
- Complete theme system (light/dark/fun) with SCSS design tokens
- Full internationalization (English/French) with fallbacks
- Database foundation with Drizzle ORM and future schema designed
- Complete SCSS design system with utility-first approach
- File system access with security validation
- Advanced Table component with filtering, sorting, inline editing
- Chat interface components ready for AI integration
- Audio recording component with proper styling

**🎯 Immediate Next Capabilities**:
- File indexing leveraging existing database and file-access features
- Universal search extending current SearchBox component
- AI chat integration building on existing chatbot components
- Screen understanding APIs (designed in future-apis.ts)
- OS automation with granular permissions system

## Requirements
- Node.js 20 LTS
- Platform: macOS, Windows (WSL2 recommended)

## Reference Documentation

**For specific task guidance, consult these files:**

### Architecture & Patterns
- `docs/architecture.md` - Complete technical architecture overview
- `docs/conventions.md` - Coding conventions and patterns
- `docs/cursor-rules.md` - Human-readable development rules

### Component Development
- `docs/howto/components.md` - Component library usage and patterns
- `docs/howto/table.md` - Advanced Table component API
- `docs/howto/search.md` - Search component integration
- `docs/howto/chatbot.md` - Chat interface components

### Feature Development
- `docs/howto/local-files.md` - File system integration patterns
- `packages/db/src/db/schema-future.ts` - Future database capabilities
- `app/preload/future-apis.ts` - Planned IPC API surface

### Project Understanding
- `project.md` - Complete vision and strategic roadmap
- `DOC.md` - Comprehensive codebase analysis and quality assessment
- `TODO.md` - Current recommendations and improvement opportunities

**Key Insight**: The codebase represents exceptional software architecture (A+ grade) with minimal technical debt. Focus on leveraging existing patterns and components rather than creating new ones.