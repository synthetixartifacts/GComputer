How to use the Chatbot UI
=========================

This guide explains how to embed the reusable chat thread and how the feature boundary is structured.

Entry points
------------
- View: `@views/StyleguideChatbotView.svelte` (demo)
- Feature: `@features/chatbot/{types.ts, store.ts, service.ts}`
- Components: `@components/chat/{ChatThread, ChatMessageList, ChatMessageBubble, ChatComposer}.svelte`

Quick start
-----------
```svelte
<script lang="ts">
  import ChatThread from '@components/chat/ChatThread.svelte';
  import { chatbotStore } from '@features/chatbot/store';

  const threadId = 'example-thread';
  chatbotStore.setActiveThread(threadId);
</script>

<ChatThread threadId={threadId} />
```

Components
----------
- ChatThread.svelte
  - Props: `threadId: string`
  - Composes list + composer; wires send via `sendMessage()`
- ChatMessageList.svelte
  - Props: `messages: ChatMessage[]`, `autoscroll?: boolean` (default true), `groupThresholdMs?: number` (default 180000)
  - Smooth autoscroll; grouping awareness
- ChatMessageBubble.svelte
  - Props: `message`, `showAvatar?`, `isFirstInGroup?`, `isLastInGroup?`
  - Role-based styles and timestamp
- ChatComposer.svelte
  - Props: `value?`, `disabled?`, `onSend: (text) => void`
  - Enter to send, Shift+Enter newline, focus restored after send

Feature API
-----------
- Store: `chatbotStore`
  - `setActiveThread(threadId)`
  - `addUserMessage(threadId, content)`
  - `addAssistantMessage(threadId, content)`
  - `replaceThreadMessages(threadId, messages)`
- Service: `sendMessage({ threadId, content }, { delayMs? })`

i18n keys
---------
- `app.menu.styleguide.chatbot`
- `pages.chatbot.title`, `pages.chatbot.desc`
- `pages.chatbot.conversationLabel`
- `pages.chatbot.role.user`, `pages.chatbot.role.assistant`
- `pages.chatbot.composer.inputLabel`, `pages.chatbot.composer.placeholder`, `pages.chatbot.composer.send`

A11y
----
- Conversation region labelled via `aria-label`.
- Textarea labelled via i18n; focus returns after sending.
- Avatars hidden from screen readers; role labels on message groups.

Extending
--------
- Streaming responses: update `service.ts` to emit partial deltas to the store.
- Attachments: extend `ChatMessage` and composer to accept uploads.
- Multi-thread: add a list UI and route to switch active threads.


