<script lang="ts">
  /**
   * ChatThread Component
   * 
   * Purpose: Generic chat UI container that combines message list and composer
   * 
   * Responsibilities:
   * - Subscribe to chatbot store for messages
   * - Combine ChatMessageList + ChatComposer
   * - Handle message sending (either via custom handler or default service)
   * - Manage scroll triggers for user messages
   * 
   * Use when: You need a complete chat UI without persistence
   * For persistent discussions, use DiscussionContainer instead
   */
  import { onDestroy } from 'svelte';
  import type { ChatMessage } from '@features/chatbot/types';
  import { chatbotStore } from '@features/chatbot/store';
  import { sendMessage } from '@features/chatbot/service';
  import { SCROLL_CONFIG } from './scroll-config';
  import ChatMessageList from './ChatMessageList.svelte';
  import ChatComposer from './ChatComposer.svelte';

  export let threadId: string;
  export let customSendHandler: ((text: string) => Promise<void>) | null = null;
  export let isStreaming: boolean = false; // New prop for parent to pass streaming state
  
  // Translation key props for different contexts
  export let copyKey: string = 'pages.styleguide.chatbot.messages.Copy';
  export let copiedKey: string = 'pages.styleguide.chatbot.messages.Copied';
  export let placeholderKey: string = 'pages.styleguide.chatbot.composer.placeholder';
  export let inputLabelKey: string = 'pages.styleguide.chatbot.composer.inputLabel';
  export let sendKey: string = 'pages.styleguide.chatbot.composer.send';

  let messages: ChatMessage[] = [];
  let userMessageTrigger: boolean = false;
  let messageVersion = 0; // Track message changes for reactivity

  const unsub = chatbotStore.subscribe((state) => {
    const thread = state.threads[threadId];
    const newMessages = thread ? thread.messages : [];
    
    // Check if this is a user message being added
    if (newMessages.length > messages.length && newMessages.length > 0) {
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage.role === 'user') {
        // Trigger scroll for user message
        userMessageTrigger = true;
        messageVersion++;
        setTimeout(() => userMessageTrigger = false, SCROLL_CONFIG.USER_MESSAGE_RESET_DELAY);
      }
    }
    
    messages = newMessages;
  });
  onDestroy(() => unsub());

  async function handleSend(text: string): Promise<void> {
    // Pre-trigger scroll (will be reinforced when message actually arrives)
    userMessageTrigger = true;
    messageVersion++;
    
    try {
      if (customSendHandler) {
        await customSendHandler(text);
      } else {
        await sendMessage({ threadId, content: text });
      }
    } catch (error) {
      // Reset trigger state on error
      userMessageTrigger = false;
      console.error('Failed to send message:', error);
      // Re-throw to let parent handle error display
      throw error;
    } finally {
      // Keep trigger active a bit longer for async message addition
      setTimeout(() => userMessageTrigger = false, SCROLL_CONFIG.USER_MESSAGE_RESET_DELAY);
    }
  }
</script>

<section class="chat-thread-container">
  <div class="chat-messages-area">
    <ChatMessageList 
      {messages} 
      {copyKey} 
      {copiedKey}
      {isStreaming}
      onUserMessage={userMessageTrigger}
    />
  </div>
  <div class="chat-composer-wrapper">
    <ChatComposer onSend={handleSend} {placeholderKey} {inputLabelKey} {sendKey} />
  </div>
</section>


