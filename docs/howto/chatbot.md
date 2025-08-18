How to use the Chatbot UI with AI Integration
=============================================

This guide explains how to embed the reusable chat thread with live AI integration and how the feature boundary is structured.

Entry points
------------
- View: `@views/development/styleguide/StyleguideChatbotView.svelte` (demo)
- AI Testing View: `@views/development/ai/TestAICommunicationView.svelte` (live AI testing)
- Chatbot Feature: `@features/chatbot/{types.ts, store.ts, service.ts}`
- AI Communication: `@features/ai-communication/{types.ts, manager.ts, service.ts, store.ts}`
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

A11y
----
- Conversation region labelled via `aria-label`.
- Textarea labelled via i18n; focus returns after sending.
- Avatars hidden from screen readers; role labels on message groups.

AI Integration
--------------
The chatbot components now integrate with the live AI communication system:

- **AI Providers**: Configure OpenAI, Anthropic, and custom providers via admin system
- **Agent Management**: Create AI agents with custom system prompts and configurations
- **Live Streaming**: Real-time AI response streaming for better user experience
- **Provider Adapters**: Extensible architecture for adding new AI providers

```svelte
<script lang="ts">
  import { aiCommunicationService } from '@features/ai-communication/service';
  import { adminStore } from '@features/admin/store';

  // Send message to AI agent
  async function sendToAI(message: string, agentId: number) {
    const agent = $adminStore.agents.find(a => a.id === agentId);
    if (!agent) return;

    const response = await aiCommunicationService.sendMessage({
      agentId,
      messages: [{ role: 'user', content: message }]
    });
    
    // Handle response...
  }
</script>
```

Extending
--------
- **Enhanced Streaming**: Real-time AI response streaming already implemented
- **Multi-Agent Chat**: Switch between different AI agents and providers
- **Conversation Persistence**: Save and load conversation history
- **Attachments**: Extend `ChatMessage` and composer to accept uploads
- **Multi-thread**: Add a list UI and route to switch active threads


