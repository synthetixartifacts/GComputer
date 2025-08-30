# Chatbot Feature Module

This module provides chat functionality including message management, scroll behaviors, and UI components.

## Structure

```
chatbot/
├── types.ts           # TypeScript interfaces for chat messages, threads
├── service.ts         # Business logic for chat operations
├── store.ts          # Svelte stores for chat state management
├── scroll-behavior.ts # Reusable scroll behavior management
└── index.ts          # Public API exports
```

## Components

### ChatScrollBehavior

A reusable, event-driven scroll behavior manager for chat interfaces.

**Features:**
- Auto-scroll to bottom on new messages
- User scroll detection (stops auto-scroll when user scrolls up)
- Smooth scrolling on user message submission
- Streaming content support
- Performance optimized (no timers, uses requestAnimationFrame)

**Usage:**
```typescript
import { ChatScrollBehavior } from '@features/chatbot';

// In component
const scrollBehavior = new ChatScrollBehavior({
  autoscroll: true,
  nearBottomThreshold: 50,
  userScrollThreshold: 100
});

// Set container
scrollBehavior.setContainer(element);

// Handle new message
await scrollBehavior.handleNewMessage(isUserMessage);

// Handle streaming
await scrollBehavior.handleStreamingUpdate();

// Cleanup
scrollBehavior.destroy();
```

## Chat Components

The chat UI components are located in `app/renderer/src/components/chat/`:

- `ChatThread.svelte` - Complete chat interface with message list and composer
- `ChatMessageList.svelte` - Scrollable message list with auto-scroll behavior
- `ChatMessageBubble.svelte` - Individual message display
- `ChatComposer.svelte` - Message input component

These components use the `ChatScrollBehavior` class for consistent scroll management across the application.