## Docs Index

- Overview: see `docs/architecture.md`
- Conventions: see `docs/conventions.md`
- How to install: see `docs/howto/install.md`
- How to run: see `docs/howto/run.md`
- Packaging: see `package.md`
- Cursor rules (human readable): see `docs/cursor-rules.md`
- Features:
  - Chatbot UI: see `docs/howto/chatbot.md`
  - Local files: see `docs/howto/local-files.md`
  - Table component: see `docs/howto/table.md`
  - Search components: see `docs/howto/search.md`

Notes:
- Styles follow a consolidated backdrop pattern: `.gc-sidebar-backdrop, .gc-modal-backdrop` share core rules; context-specific z-index is applied per component.

Key modules right now:
- Views: `@views/*` wired via a simple hash router.
- Features: `@features/router` (hash routing), `@features/ui` (theme, sidebar, modal), `@features/files-access`, `@features/search`, `@features/db`.

Short project pitch: Desktop app to index everything on your computer (files, photos, videos, docs, code, audio), extract metadata and embeddings, and enable natural search + chat with your content. See `project.md` for full brainstorm.


