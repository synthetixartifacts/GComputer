<script lang="ts">
  /**
   * ChatMessageList Component
   * 
   * Purpose: Pure presentation component for displaying chat messages
   * 
   * Responsibilities:
   * - Render list of chat messages
   * - Handle scroll behavior (auto-scroll, user scroll detection)
   * - Group messages by sender and time
   * - NO business logic, NO API calls, NO state management
   * 
   * Use when: You need to display messages with scroll behavior
   * Always used inside ChatThread, never standalone
   */
  import type { ChatMessage } from '@features/chatbot/types';
  import ChatMessageBubble from './ChatMessageBubble.svelte';
  import { createPageScroll } from './usePageScroll';
  import { SCROLL_CONFIG } from './scroll-config';
  import { onMount, onDestroy } from 'svelte';
  import { tick } from 'svelte';

  export let messages: ChatMessage[] = [];
  export let groupThresholdMs: number = 3 * 60 * 1000; // 3 min grouping window
  export let isStreaming: boolean = false;
  export let onUserMessage: boolean = false;
  
  // Translation key props for different contexts
  export let copyKey: string = 'pages.styleguide.chatbot.messages.Copy';
  export let copiedKey: string = 'pages.styleguide.chatbot.messages.Copied';

  let pageScroll = createPageScroll();
  let previousMessageCount = 0;

  // Handle messages change - scroll on new messages
  $: if (messages.length > 0) {
    handleMessagesChange();
  }

  // Handle user message - always scroll
  $: if (onUserMessage) {
    tick().then(() => {
      pageScroll.forceScroll();
    });
  }

  // Handle streaming - keep scrolling
  $: if (isStreaming) {
    pageScroll.handleContentAdded();
  }

  async function handleMessagesChange() {
    const currentCount = messages.length;
    
    // Check if this is initial load or new messages
    if (previousMessageCount === 0 && currentCount > 0) {
      // Initial load - wait for render then scroll
      await tick();
      setTimeout(() => {
        pageScroll.scrollToBottom();
      }, SCROLL_CONFIG.INITIAL_LOAD_DELAY);
    } else if (currentCount > previousMessageCount) {
      // New message added
      await tick();
      pageScroll.handleContentAdded();
    }
    
    previousMessageCount = currentCount;
  }

  function handleWindowScroll() {
    pageScroll.checkUserScroll();
  }

  onMount(() => {
    // Add window scroll listener
    window.addEventListener('scroll', handleWindowScroll);
    
    // Give page time to render with content
    if (messages.length > 0) {
      setTimeout(() => {
        pageScroll.scrollToBottom();
      }, SCROLL_CONFIG.MOUNT_SCROLL_DELAY);
    }
  });

  onDestroy(() => {
    window.removeEventListener('scroll', handleWindowScroll);
    pageScroll.destroy();
  });

  function isFirstInGroup(index: number): boolean {
    if (index === 0) return true;
    const prev = messages[index - 1];
    const curr = messages[index];
    if (prev.role !== curr.role) return true;
    const prevTime = new Date(prev.createdAtIso).getTime();
    const currTime = new Date(curr.createdAtIso).getTime();
    return currTime - prevTime > groupThresholdMs;
  }

  function isLastInGroup(index: number): boolean {
    if (index === messages.length - 1) return true;
    const next = messages[index + 1];
    const curr = messages[index];
    if (next.role !== curr.role) return true;
    const nextTime = new Date(next.createdAtIso).getTime();
    const currTime = new Date(curr.createdAtIso).getTime();
    return nextTime - currTime > groupThresholdMs;
  }
</script>

<div class="message-list-container" aria-label="Conversation">
  <div class="message-list-content">
    {#each messages as msg, i (msg.id)}
      <ChatMessageBubble
        message={msg}
        isFirstInGroup={isFirstInGroup(i)}
        isLastInGroup={isLastInGroup(i)}
        {copyKey}
        {copiedKey}
      />
    {/each}
  </div>
</div>

