## Docs Index

- Overview: see `docs/architecture.md`
- Conventions: see `docs/conventions.md`
- How to install: see `docs/howto/install.md`
- How to run: see `docs/howto/run.md`
- Packaging: see `package.md`
- Cursor rules (human readable): see `docs/cursor-rules.md`

Key modules right now:
- Views: `HomeView.svelte`, `AboutView.svelte`, `StyleguideView.svelte` wired via a simple hash router.
- Features: `@features/router` (hash routing), `@features/ui` (theme, sidebar, modal), `@features/browse` (placeholder).

Short project pitch: Desktop app to index everything on your computer (files, photos, videos, docs, code, audio), extract metadata and embeddings, and enable natural search + chat with your content. See `project.md` for full brainstorm.


