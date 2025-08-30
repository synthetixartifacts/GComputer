# Chat Components Usage Guide

## Component Usage Across the Application

### 1. **StyleguideChatbotView** (Simplest Usage)
**Location**: `/views/development/styleguide/StyleguideChatbotView.svelte`

```svelte
<ChatThread threadId={threadId} />
```

**Use Case**: Simple demo showing chat UI without any backend
- No custom send handler
- No persistence
- Pure UI demonstration

### 2. **TestAICommunicationView** (AI Testing)
**Location**: `/views/development/ai/TestAICommunicationView.svelte`

```svelte
<ChatThread 
  {threadId} 
  customSendHandler={handleSend}
  {isStreaming}
  copyKey="pages.development.ai.messages.copy"
  copiedKey="pages.development.ai.messages.copied"
  placeholderKey="pages.development.ai.composer.placeholder"
  inputLabelKey="pages.development.ai.composer.inputLabel"
  sendKey="pages.development.ai.composer.send"
/>
```

**Use Case**: Testing AI providers without persistence
- Custom send handler for AI communication
- Streaming support
- Token usage tracking
- No database persistence (test only)

### 3. **DiscussionContainer** (Production Usage)
**Location**: `/components/discussion/DiscussionContainer.svelte`

```svelte
<ChatThread
  {threadId}
  {isStreaming}
  customSendHandler={handleSendMessage}
  copyKey="discussion.chat.messages.copy"
  copiedKey="discussion.chat.messages.copied"
  placeholderKey="discussion.chat.composer.placeholder"
  inputLabelKey="discussion.chat.composer.inputLabel"
  sendKey="discussion.chat.composer.send"
/>
```

**Use Case**: Full-featured AI discussions with persistence
- Database persistence
- Discussion management
- Agent validation
- Streaming AI responses
- Message history

## Architecture Summary

```
┌──────────────────────────────────────────────┐
│           Application Views                   │
├──────────────────────────────────────────────┤
│                                               │
│  StyleguideChatbotView    (Demo UI)          │
│         ↓                                     │
│  TestAICommunicationView  (AI Testing)       │
│         ↓                                     │
│  DiscussionChatView       (Production)       │
│         ↓                                     │
│  ┌────────────────────────────────────┐      │
│  │    DiscussionContainer             │      │
│  │    (Smart Component)               │      │
│  │    - Persistence                   │      │
│  │    - AI Communication              │      │
│  │    ↓                               │      │
│  │  ┌──────────────────────────┐      │      │
│  │  │     ChatThread           │      │      │
│  │  │   (UI Container)         │      │      │
│  │  │   ↓              ↓       │      │      │
│  │  │ ChatMessageList Composer │      │      │
│  │  └──────────────────────────┘      │      │
│  └────────────────────────────────────┘      │
└──────────────────────────────────────────────┘
```

## Key Features by Implementation

| Feature | Styleguide | AI Test | Discussion |
|---------|------------|---------|------------|
| **Message Display** | ✅ | ✅ | ✅ |
| **Message Input** | ✅ | ✅ | ✅ |
| **Auto-scroll** | ✅ | ✅ | ✅ |
| **Custom Send Handler** | ❌ | ✅ | ✅ |
| **AI Communication** | ❌ | ✅ | ✅ |
| **Streaming Support** | ❌ | ✅ | ✅ |
| **Database Persistence** | ❌ | ❌ | ✅ |
| **Discussion Management** | ❌ | ❌ | ✅ |
| **Agent Selection** | ❌ | ✅ | ✅ |
| **Token Usage** | ❌ | ✅ | ❌ |

## Best Practices

1. **For Simple Chat UI**: Use `ChatThread` directly
2. **For AI Testing**: Use `ChatThread` with `AIChatbotBridge`
3. **For Production Discussions**: Use `DiscussionContainer`
4. **Never duplicate persistence logic** - use DiscussionContainer
5. **Always pass translation keys** for i18n support
6. **Pass isStreaming prop** when handling AI responses

## Component Props Reference

### ChatThread
- `threadId: string` - Required, unique thread identifier
- `customSendHandler?: (text: string) => Promise<void>` - Optional custom message handler
- `isStreaming?: boolean` - Whether AI is currently streaming
- `copyKey?: string` - Translation key for copy button
- `copiedKey?: string` - Translation key for copied state
- `placeholderKey?: string` - Translation key for input placeholder
- `inputLabelKey?: string` - Translation key for input label
- `sendKey?: string` - Translation key for send button

### DiscussionContainer
- `discussion?: DiscussionWithMessages` - Existing discussion data
- `agent?: Agent` - Selected AI agent
- `onDiscussionCreated?: (discussion) => void` - New discussion callback
- `onTitleChange?: (title) => void` - Title update callback
- `onFavoriteToggle?: () => void` - Favorite toggle callback