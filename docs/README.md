## Docs Index

- Overview: see `docs/architecture.md`
- Conventions: see `docs/conventions.md`
- How to install: see `docs/howto/install.md`
- How to run: see `docs/howto/run.md`
- Packaging: see `package.md`
- Cursor rules (human readable): see `docs/cursor-rules.md`
- Components & Features:
  - Component Library API: see `docs/howto/components.md`
  - Table component: see `docs/howto/table.md`
  - Search components: see `docs/howto/search.md`
  - Chatbot UI: see `docs/howto/chatbot.md`
  - Local files: see `docs/howto/local-files.md`

Notes:
- Styles follow a consolidated backdrop pattern: `.gc-sidebar-backdrop, .gc-modal-backdrop` share core rules; context-specific z-index is applied per component.

Key modules right now:
- Views: 21 `@views/*` components wired via hash router with dev/prod gating
- Features: 10 production features with consistent types/service/store architecture:
  - `@features/router` - Type-safe hash routing with 19 routes
  - `@features/settings` - Persistent configuration with IPC + localStorage fallback  
  - `@features/ui` - Global UI state (theme, sidebar, modal)
  - `@features/i18n` - English/French localization system
  - `@features/browse` - File browsing with path input
  - `@features/files-access` - File picker integration with UI mapping
  - `@features/db` - Full CRUD operations with staged editing
  - `@features/search` - Search infrastructure with suggestions
  - `@features/chatbot` - Chat interface with thread management
  - `@features/navigation` - Hierarchical menu system
- Components: 16 production-ready UI components including advanced Table (filtering/sorting/editing), FileList, SearchBox, Modal, NavTree, complete chat system, and audio recording

Short project pitch: Desktop app to index everything on your computer (files, photos, videos, docs, code, audio), extract metadata and embeddings, and enable natural search + chat with your content. See `project.md` for full brainstorm.


