<script lang="ts">
  import { onMount, afterUpdate, onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import type { Message } from '@features/discussion/types';
  import { t } from '@ts/i18n';
  
  export let messages: Message[] = [];
  export let isStreaming: boolean = false;
  export let streamingContent: string = '';
  export let showTypingIndicator: boolean = false;
  export let autoScroll: boolean = true;
  
  let messagesContainer: HTMLDivElement;
  let shouldAutoScroll = autoScroll;
  let isUserScrolling = false;
  let scrollTimeout: ReturnType<typeof setTimeout>;
  
  // Only show user and agent messages (filter out system messages)
  $: displayMessages = messages.filter(msg => msg.who === 'user' || msg.who === 'agent');
  
  onMount(() => {
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', handleScroll);
      scrollToBottom();
    }
  });
  
  onDestroy(() => {
    if (messagesContainer) {
      messagesContainer.removeEventListener('scroll', handleScroll);
    }
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
  });
  
  afterUpdate(() => {
    if (shouldAutoScroll && !isUserScrolling) {
      scrollToBottom();
    }
  });
  
  function handleScroll() {
    clearTimeout(scrollTimeout);
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    isUserScrolling = true;
    shouldAutoScroll = isAtBottom;
    
    scrollTimeout = setTimeout(() => {
      isUserScrolling = false;
    }, 150);
  }
  
  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }
  
  function formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  function formatMessage(content: string): string {
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }
  
  function copyMessage(content: string) {
    navigator.clipboard.writeText(content);
    // Could add a toast notification here
  }
</script>

<div class="discussion-thread" bind:this={messagesContainer}>
  {#if displayMessages.length === 0}
    <div class="empty-thread">
      <p>{$t('discussion.thread.empty')}</p>
      <p class="hint">{$t('discussion.thread.startHint')}</p>
    </div>
  {:else}
    <div class="messages-list">
      {#each displayMessages as message, index (message.id)}
        <div 
          class="message-wrapper {message.who}"
          in:fly={{ y: 20, duration: 300, delay: index * 50 }}
        >
          <div class="message-bubble">
            <div class="message-header">
              <span class="message-author">
                {message.who === 'user' ? $t('discussion.thread.you') : $t('discussion.thread.ai')}
              </span>
              <span class="message-time">
                {formatTime(message.createdAt)}
              </span>
            </div>
            
            <div class="message-content">
              {@html formatMessage(message.content)}
            </div>
            
            <div class="message-actions">
              <button
                type="button"
                class="action-btn"
                on:click={() => copyMessage(message.content)}
                aria-label="Copy message"
                title={$t('common.copy')}
              >
                📋
              </button>
            </div>
          </div>
        </div>
      {/each}
      
      {#if isStreaming && streamingContent}
        <div class="message-wrapper agent streaming">
          <div class="message-bubble">
            <div class="message-header">
              <span class="message-author">{$t('discussion.thread.ai')}</span>
              <span class="streaming-indicator">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </span>
            </div>
            
            <div class="message-content">
              {@html formatMessage(streamingContent)}
              <span class="cursor">▊</span>
            </div>
          </div>
        </div>
      {/if}
      
      {#if showTypingIndicator && !isStreaming}
        <div class="typing-indicator" in:fade={{ duration: 200 }}>
          <span>{$t('discussion.thread.typing')}</span>
          <span class="dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </span>
        </div>
      {/if}
    </div>
  {/if}
  
  {#if !shouldAutoScroll && displayMessages.length > 3}
    <button
      type="button"
      class="scroll-to-bottom"
      on:click={scrollToBottom}
      transition:fade={{ duration: 200 }}
      aria-label="Scroll to bottom"
    >
      ↓ {$t('discussion.thread.newMessages')}
    </button>
  {/if}
</div>

<style>
  .discussion-thread {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-md);
    position: relative;
    scroll-behavior: smooth;
  }
  
  .empty-thread {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: var(--color-text-secondary);
  }
  
  .empty-thread .hint {
    margin-top: var(--spacing-sm);
    font-size: 0.875rem;
    opacity: 0.7;
  }
  
  .messages-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding-bottom: var(--spacing-xl);
  }
  
  .message-wrapper {
    display: flex;
    animation: fadeIn 0.3s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .message-wrapper.user {
    justify-content: flex-end;
  }
  
  .message-wrapper.agent {
    justify-content: flex-start;
  }
  
  .message-bubble {
    max-width: 70%;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    position: relative;
  }
  
  .user .message-bubble {
    background: var(--color-primary);
    color: white;
    border-bottom-right-radius: var(--radius-xs);
  }
  
  .agent .message-bubble {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border-bottom-left-radius: var(--radius-xs);
  }
  
  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xs);
    font-size: 0.75rem;
    opacity: 0.8;
  }
  
  .message-author {
    font-weight: 600;
  }
  
  .message-content {
    line-height: 1.5;
    word-wrap: break-word;
  }
  
  .message-content :global(strong) {
    font-weight: 600;
  }
  
  .message-content :global(em) {
    font-style: italic;
  }
  
  .message-content :global(code) {
    background: rgba(0, 0, 0, 0.1);
    padding: 0.125rem 0.25rem;
    border-radius: var(--radius-xs);
    font-family: monospace;
    font-size: 0.875em;
  }
  
  .user .message-content :global(code) {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .message-actions {
    position: absolute;
    top: var(--spacing-xs);
    right: var(--spacing-xs);
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .message-bubble:hover .message-actions {
    opacity: 1;
  }
  
  .action-btn {
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: var(--radius-xs);
    padding: 0.25rem;
    cursor: pointer;
    font-size: 0.875rem;
    line-height: 1;
  }
  
  .action-btn:hover {
    background: white;
  }
  
  .streaming .message-bubble {
    border: 1px solid var(--color-primary);
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { border-color: var(--color-primary); }
    50% { border-color: transparent; }
  }
  
  .streaming-indicator {
    display: inline-flex;
    gap: 2px;
  }
  
  .cursor {
    animation: blink 1s infinite;
  }
  
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  .typing-indicator {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm);
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    font-style: italic;
  }
  
  .dots {
    display: inline-flex;
    gap: 2px;
  }
  
  .dot {
    width: 4px;
    height: 4px;
    background: currentColor;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;
  }
  
  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }
  
  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% {
      transform: scale(1.2);
      opacity: 1;
    }
  }
  
  .scroll-to-bottom {
    position: absolute;
    bottom: var(--spacing-md);
    left: 50%;
    transform: translateX(-50%);
    padding: var(--spacing-xs) var(--spacing-md);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    box-shadow: 0 2px 8px var(--color-shadow);
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-primary);
    transition: all 0.2s;
  }
  
  .scroll-to-bottom:hover {
    background: var(--color-primary);
    color: white;
  }
</style>