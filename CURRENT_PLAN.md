## Chatbot Styleguide and Feature Skeleton Plan

Goal: Add a new styleguide section and a scalable feature skeleton to design the main chat thread UI/UX for conversations with an AI assistant. This includes a reusable thread layout, message bubbles, and a composer (input) area. No backend integration yet; prepare clean abstractions for future growth.

### Scope (v1)
- Focus only on the main chat thread area: message list and composer.
- Clear differentiation between user and assistant messages.
- Reusable components designed to be embedded in future views/threads.
- All logic isolated in `@features/chatbot/*`; views are thin; UI in `@components/chat/*`.

### Deliverables
- New menu item under `Test → Styleguide → Chatbot`.
- New route: `test.styleguide.chatbot`.
- New view: `@views/StyleguideChatbotView.svelte` demonstrating the chat UI.
- New feature skeleton: `@features/chatbot/{types.ts, service.ts, store.ts}`.
- New reusable components: `@components/chat/ChatMessageBubble.svelte`, `ChatMessageList.svelte`, `ChatComposer.svelte`, `ChatThread.svelte`.
- i18n keys in `en.json` and `fr.json` for menu labels, page title, and composer placeholders/actions.

### Non-goals (for later iterations)
- Sidebar/discussion list, attachments/uploads, code formatting, streaming tokens, tool-calls, persistence, multi-thread management.

### Architecture decisions
- Use Svelte stores in `@features/chatbot/store.ts` for in-memory thread state.
- `@features/chatbot/service.ts` will expose IO boundaries (later to wire IPC/HTTP). For v1 it will only simulate.
- Components are stateless where possible and driven by props; state lives in stores.
- Keep styling with Tailwind utility classes consistent with existing patterns; minimal SCSS additions if necessary.

---

### Step-by-step (execute ONE at a time)

- [x] 1) Scaffold feature: create `@features/chatbot/{types.ts, service.ts, store.ts}` with strict types, minimal stores, and stubs (no UI yet)
- [x] 2) Add i18n keys (EN/FR) for: menu `app.menu.styleguide.chatbot`, page `pages.chatbot.*`, composer placeholders/actions
- [x] 3) Add route type and wiring: extend `@features/router/types.ts`, update `@views/App.svelte` switch, create `@views/StyleguideChatbotView.svelte` (stub)
- [x] 4) Add navigation item under `Test → Styleguide` in `@features/navigation/store.ts`
- [x] 5) Build core UI components in `@components/chat/*`:
  - `ChatMessageBubble.svelte` (user vs assistant variants)
  - `ChatMessageList.svelte` (virtualized-ready API, autoscroll to bottom)
  - `ChatComposer.svelte` (textarea + send button, multiline, disabled states)
  - `ChatThread.svelte` (composition of list + composer)
- [x] 6) Implement the styleguide view demo: seed sample messages in store, wire composer to append user messages, simulate assistant response with delay in service
- [x] 7) a11y/i18n pass: labels, aria attributes, keyboard handling, focus management on send
- [x] 8) Typecheck/build run and fix issues
- [x] 9) Add brief docs: `docs/howto/chatbot.md` with usage snippets and component props

### Definition of done (v1)
- New menu item navigates to the Chatbot styleguide view.
- Chat thread demo shows user and assistant messages distinctly.
- Typing and sending in composer appends to the thread and shows a simulated assistant reply.
- Components are reusable and typed; no renderer imports of Node/Electron APIs.
- `npm run typecheck` and `npm run build` succeed.

### Risks/mitigations
- Over-engineering v1: keep stores minimal; simulate only basic responses.
- Styling drift: follow existing Tailwind patterns; reuse variables where applicable.
- Future growth: typed boundaries in `service.ts` and `types.ts` to evolve without breaking UI.

