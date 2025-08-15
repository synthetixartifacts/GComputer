# GComputer — Consolidated Project Document

*(replaces the original brainstorm; adds the **Everything-App** vision while keeping the current base setup, goals, and technical plan)*

---

## 0) Quick Summary

**What it is now.** A secure, typed **Electron + Svelte 5** desktop app with routing, settings (persisted in Main), i18n (en/fr), and a composable UI shell.
**What it becomes.** The **Everything App** for your computer: unified search, chat, and **automation**. It can **see your screen** (with consent), **control apps** (with explicit approval), and **do tasks for you**—or explain how.
**How we get there.** Expand today’s local-indexing foundation into **agents + tools**, **screen understanding**, and **OS automation adapters**, all under a **local-first, permissioned** model.

---

## 1) Vision & Scope

**Ultimate vision.** A **local-first personal operating layer** that lets you do everything you can do on a computer—**faster, safer, explainable**—from one place: search, create, automate, control, and learn.

**Core pillars**

1. **Understand** — Index files, windows, clipboard, and context; summarize and relate.
2. **Decide** — Plan steps with an on-device or private model; show reasoning outlines.
3. **Act** — Execute safe, auditable actions across apps/OS with granular consent.
4. **Teach** — Explain what happened, suggest next steps, and coach the user.

**Out-of-scope (for now).**

* Cross-device sync/cloud backup
* Full app replacement (e.g., full IDE/DAW); we integrate and orchestrate instead

---

## 2) Current State (implemented)

**Processes & responsibilities**

* **Main (`app/main/`)**

  * Window lifecycle; loads dev server or built HTML
  * **Settings** persisted at `userData/settings.json` (validated, versioned)
  * IPC: `settings:all`, `settings:get`, `settings:set` (+ broadcast `settings:changed`)
  * Native menu with localized labels (separate from renderer i18n)
  * Security: `contextIsolation: true`, `nodeIntegration: false`
* **Preload (`app/preload/`)**

  * Minimal API via `contextBridge`
  * `window.gc.settings = { all,get,set,subscribe }`
* **Renderer (`app/renderer/`)**

  * Svelte 5 UI; hash router; i18n (en/fr); theme cycling (`light` → `dark` → `fun`)
  * UI shell (header/footer/sidebar/modal)

**Directory layout**

```
app/
  main/            # Electron main → dist/main/index.cjs
  preload/         # Preload (secure IPC) → dist/preload/index.cjs
  renderer/
    index.html
    src/
      styles/      # Tailwind + global SCSS
      components/  # shared components
      views/       # thin Svelte views
      ts/
        main.ts
        features/
          router/   # hash router (types, service, store)
          settings/ # settings types/service/store
          i18n/     # i18n types/service/store + locales/en.json, fr.json
          ui/       # shell state (sidebar, modal, theme)
          browse/   # placeholder
```

**Path aliases (renderer):** `@renderer/*`, `@views/*`, `@ts/*`, `@features/*`, `@components/*`.

**Build & scripts**

* `npm run dev` — Vite (renderer) + esbuild watch (main/preload) + Electron
* `npm run build` — builds all to `dist/`
* `npm run typecheck` — strict TS

**Artifacts:**
Main → `dist/main/index.cjs` · Preload → `dist/preload/index.cjs` · Renderer → `dist/renderer/`

**Libraries present (to be wired):** `sql.js`, `drizzle-orm`, `exifr`, `mammoth`, `pdf-parse`, `sharp`.

**Conventions**

* Thin views; logic/IO in `features/*/{service,store}.ts`
* Svelte stores with explicit subscriptions
* Naming: camelCase (vars/fns), PascalCase (types & Svelte), folders kebab-case

---

## 3) UX Structure (target)

**Global elements**

* **Command Palette** (⌘K / Ctrl+K): search, run actions, ask chat, open tools
* **Context Bar**: shows current scope (workspace, app window, selection)
* **Heads-Up Overlay** (permissioned): inline suggestions on top of apps

**Primary screens**

1. **Indexing** — choose folders, privacy toggles, job queue/progress
2. **Search** — natural language + filters; list/grid; preview with metadata & actions
3. **Chat** — conversational agent with **citations** and **actions**
4. **Automations** — create/run workflows; history; approvals
5. **Settings** — language, theme, folders, privacy, model/AI, automation permissions

---

## 4) Capabilities Map

| Domain       | MVP (V1.0)                                           | Near-term (V1.1–V1.2)                                            | Long-term (V2)                                                     |
| ------------ | ---------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| Files/Search | Local index (TXT/MD/PDF/DOCX, EXIF). Keyword search. | Vector search (text). Facets & advanced filters.                 | Multi-modal search (image/audio). Cross-app linking & collections. |
| Chat         | Q/A with citations to local files.                   | Tool-use (summarize, tag, rename). Memory of recent context.     | Project/goal agents spanning files, apps, and web (opt-in).        |
| Screen Sense | —                                                    | Screen capture (consent), OCR, basic element detection.          | UI model of current app; intent detection; overlay suggestions.    |
| Automation   | —                                                    | App actions: open, type, click, run CLI; file ops with approval. | Rich workflows: conditional steps, loops, schedulers, web RPA.     |
| OS Control   | —                                                    | macOS: AppleScript/Shortcuts; Win: PowerShell/WinRT adapters.    | Native service w/ accessibility APIs; per-app sandboxes.           |
| Voice        | —                                                    | Push-to-talk, TTS replies.                                       | Continuous assist; ear-con cues; low-latency streaming.            |
| Privacy/Sec  | Local-first settings; explicit opt-ins.              | Per-tool scopes, just-in-time prompts, signed actions log.       | DB encryption; policy packs; enterprise RBAC/profile separation.   |

---

## 5) Architecture

**Why this stack**

* **Electron + TypeScript**: cross-platform, strong typing, controlled OS access
* **Svelte 5 + Tailwind/SCSS**: fast, minimal UI runtime
* **SQLite + Drizzle**: single-file DB with typed schema & migrations; add vector ext
* **Composable services**: indexer, parsers, embeddings, search, automations, chat

**Logical components**

* **Main**: app lifecycle, secure IPC, menu, auto-update
* **Preload**: whitelisted API surface
* **Renderer**: UI (Search/Chat/Automations/Settings)
* **Services (Node)**

  * **Scanner** (walk + `chokidar` watchers)
  * **Parsers** (`pdf-parse`, `mammoth`, `exifr`, `sharp`, later `xlsx/csv`)
  * **Embedding** (driver: cloud/local ONNX)
  * **DB** (SQLite/Drizzle; vector ext like `sqlite-vec`/`sqlite-vss`)
  * **Search** (FTS/BM25 + vector fusion)
  * **Automation Adapters**

    * macOS: AppleScript/JXA, Shortcuts, shell
    * Windows: PowerShell, COM/WinRT bridges
    * Cross-platform: CLI processes, file ops, clipboard
  * **Screen Understanding**

    * Electron `desktopCapturer` (prompted), window bounds
    * OCR (Tesseract/Onnx), simple detector (templates/vision model)
  * **Agent Runtime**

    * Planner (tool-selection) → **Approval** → Executor → Verifier

**Action lifecycle (safety by design)**

1. **Observe** (optional: screen, selection, clipboard)
2. **Plan** (transparent steps; show diffs where possible)
3. **Approve** (scoped, time-boxed permissions)
4. **Act** (idempotent, cancellable)
5. **Verify** (check post-conditions; show log)

---

## 6) Data Model (draft)

**Core tables**

* `files(id, path, dir, name, ext, size, mtime, ctime, hash, mime, kind, status)`
* `file_meta(file_id, key, value)`        // EXIF/custom tags
* `file_text(file_id, chunk_id, text, token_count)`
* `file_vectors(file_id, chunk_id, embedding VECTOR)` // cosine
* `tags(file_id, tag, source, confidence)`
* `jobs(id, type, status, started_at, finished_at, error)`
* `actions(id, kind, params_json, result_json, status, approved_by, created_at)` // audit
* `permissions(id, tool, scope, granted_at, expires_at, rationale)`             // consent

**Indexes**
B-tree on `path`, `mtime`, `tag`; vector index on `file_vectors.embedding`.

---

## 7) IPC Contracts

**Current**

* `settings:all` · `settings:get(key)` · `settings:set(key,value)`
* Preload: `window.gc.settings = { all(), get(k), set(k,v), subscribe(fn) }`

**Planned (examples)**

* `folders:add|remove|list`
* `indexer:start|pause|resume|status`
* `search:query` (text + filters + semantic) → results + snippets
* `chat:ask` (prompt, scope) → answer + citations + suggested actions
* `screen:capture` (prompted) → image + OCR text + regions
* `automation:execute` (tool, params) → requires `permissions.grant`
* `permissions:grant|revoke|list` (scopes: files, clipboard, app, window)

*All APIs remain **preload-whitelisted**; no Node/Electron in renderer.*

---

## 8) Security & Privacy

* **Local by default**; cloud AI **off** unless explicitly enabled
* **Granular scopes**: e.g., “read \~/Documents/Invoices”, “control Finder only”
* **Just-in-time consent** with TTL; revoke anytime
* **Outbound minimization**: send deltas/snippets, never whole files silently
* **Secrets**: OS keychain (Keychain/DPAPI)
* **Optional** DB encryption (SQLCipher)
* **Action log**: signed, human-readable; “dry-run” mode for every workflow
* **Biometrics/people**: disabled by default; separate consent

---

## 9) Tech Stack (current & planned)

**Current**

* **Electron** (Main/Preload/Renderer) · **TypeScript (strict)**
* **Svelte 5** · **Tailwind CSS + SCSS** via `svelte-preprocess`
* **Vite** (renderer) · **esbuild** (main/preload)

**Present libs (to wire)**

* **SQLite** (`sql.js`) + **Drizzle ORM**
* Parsers: `exifr`, `mammoth`, `pdf-parse`
* Imaging: `sharp`

**Planned additions**

* **Vector**: SQLite vector extension (e.g., `sqlite-vec`/`sqlite-vss`)
* **Embeddings**: cloud (OpenAI/Cohere/Voyage/…) + local ONNX fallback
* **OCR/Vision**: Tesseract/ONNX; later lightweight UI element detectors
* **Automation**: AppleScript/JXA/Shortcuts (macOS), PowerShell/WinRT (Windows)
* **Voice**: VAD + TTS/ASR provider adapters
* **Scheduler**: in-process queue (bullmq-style semantics without Redis)

---

## 10) Packaging & Releases

* **electron-builder**

  * macOS: `.app`/`.dmg`, hardened runtime + notarization
  * Windows: `.exe` (NSIS), optional portable
* Auto-update from GitHub Releases/S3; later delta updates
* CI: typecheck → tests → build → signed artifacts → release notes

---

## 11) Roadmap

**Phase 1 — Core search foundation (in progress)**

* Hook **SQLite + Drizzle** (migrations)
* **Scanner + Parsers** (TXT/MD/PDF/DOCX, EXIF)
* **Search (keyword)** UI with preview & quick actions
* Settings: folders, language, theme, privacy toggles

**Phase 2 — Semantic & Chat**

* **Embeddings (cloud first)** with cache; toggle **local ONNX**
* **Vector search** + hybrid ranking; facets/filters
* **Chat with citations** and simple file actions (summarize, tag, rename)

**Phase 3 — Automations (starter)**

* **Command Palette** to run safe built-ins (open/reveal, convert, rename batch)
* **Automation Adapters** (macOS/Windows) for basic app control (open app, open file, run CLI)
* **Approval UI** + **Action Log** + **Dry-run** for every action

**Phase 4 — Screen Understanding**

* **Screen capture (consent)** + OCR; detect common UI regions
* Overlay suggestions: “copy table to CSV”, “fill this form”, “rename downloads by pattern”
* Intent → plan → confirm → execute → verify loop

**Phase 5 — Workflows & Coaching**

* Visual workflow builder (if/then/loop, timers, schedules)
* Domain packs (e.g., “Inbox Zero”, “Photo curation”, “Project kickoff”)
* Voice push-to-talk; live coaching (“here’s how to do this in X app”)

---

## 12) Risks & Mitigations

* **OS automation fragility** → adapters per OS, retries, verifiers, user-visible diffs
* **Privacy concerns** → explicit scopes, TTL permissions, signed logs, offline mode
* **Model latency/cost** → caching, batching, local models where feasible
* **Large corpora** → incremental indexing, content-hash dedupe, throttled embeds
* **PDF/vision edge cases** → layered fallback (text → OCR → summarize failures)

---

## 13) How to Run (current repo)

* Install: `docs/howto/install.md`
* Dev: `npm run dev`
* Build: `npm run build`
* Typecheck: `npm run typecheck`
* Architecture: `docs/architecture.md`
* Docs index: `docs/README.md`

---

## 14) Next Concrete Steps

1. **Finalize DB schema** (files/text/vectors/tags/jobs/actions/permissions) and migrations.
2. Implement **Scanner + Parsers** → write to DB; preview in Search UI.
3. Add **Embeddings driver** (cloud) + cache; wire **vector search**.
4. Ship **Chat with citations** and **basic actions** (summarize/rename/tag).
5. Add **Command Palette** and first **Automation Adapters** (open app/file; run CLI).
6. Introduce **Approval UI + Action Log + Dry-run**.
7. Add **Screen capture + OCR** (opt-in) and minimal overlay suggestions.

---

## 15) Glossary

* **Agent Runtime**: planner/executor/verifier that chooses tools to complete goals.
* **Scope/Permission**: time-boxed authorization for a tool (e.g., “control Finder 5 min”).
* **Dry-run**: simulated execution that shows intended changes without applying them.
* **Vector Search**: nearest-neighbor retrieval over embeddings (semantic search).

---

*End of document*
