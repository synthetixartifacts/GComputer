# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GComputer is an Electron desktop application built with TypeScript, Svelte 5, and Tailwind CSS. The ultimate vision is a "local-first personal operating layer" that indexes, searches, and automates interactions with files and applications on the user's computer.

**Current state**: Functional Electron app with settings persistence, i18n (en/fr), theming, hash routing, and database foundation.

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
  preload/        # IPC bridge → dist/preload/index.cjs  
  renderer/
    src/
      views/      # Page-level Svelte components
      components/ # Shared UI components
      ts/
        features/ # Feature modules (types, service, store)
        i18n/     # Internationalization
      styles/     # Global SCSS (base/ and components/)

packages/db/      # Drizzle + better-sqlite3 workspace
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

- **Technology**: SQLite with Drizzle ORM in workspace package `@gcomputer/db`
- **Location**: `packages/db/data/gcomputer.db`
- **Schema**: `packages/db/src/db/schema.ts`
- **Migrations**: Auto-generated in `packages/db/drizzle/`
- **Access**: Via preload-exposed `window.gc.db` API

## Key Features

### Router
- Hash-based routing under `@features/router/`
- Route union type for type safety
- Dev-only routes gated with `import.meta.env.DEV`

### Settings
- Persisted to `userData/settings.json`
- Validated and versioned
- IPC: `settings:all`, `settings:get`, `settings:set`
- Exposed via `window.gc.settings`

### Internationalization
- English and French locales
- Feature under `@ts/i18n/`
- Separate main process menu localization

### Theming
- Three themes: `light`, `dark`, `fun`
- Cycling theme toggle
- Managed via `@features/ui/`

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

**Implemented**:
- Electron security model with IPC
- Settings persistence and UI
- Hash routing with type safety  
- Theme cycling (light/dark/fun)
- Internationalization (en/fr)
- Database foundation with Drizzle
- Component library and styling system

**Planned**:
- File indexing and search
- Vector embeddings and semantic search
- Chat interface with file citations
- Screen capture and automation
- OS-level integrations

## Requirements
- Node.js 20 LTS
- Platform: macOS, Windows (WSL2 recommended)