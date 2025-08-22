<script lang="ts">
  import type { ChatMessage } from '@features/chatbot/types';
  import ChatMessageBubble from './ChatMessageBubble.svelte';
  import { afterUpdate, onMount, tick } from 'svelte';

  export let messages: ChatMessage[] = [];
  export let autoscroll: boolean = true;
  export let groupThresholdMs: number = 3 * 60 * 1000; // 3 min grouping window
  
  // Translation key props for different contexts
  export let copyKey: string = 'pages.styleguide.chatbot.messages.Copy';
  export let copiedKey: string = 'pages.styleguide.chatbot.messages.Copied';

  let scroller: HTMLDivElement | null = null;
  let userHasScrolled: boolean = false;
  let isNearBottom: boolean = true;
  let lastMessageCount: number = 0;

  onMount(() => {
    if (autoscroll) scrollToBottom(true);
  });

  afterUpdate(async () => {
    // Check if new messages were added
    if (messages.length > lastMessageCount) {
      lastMessageCount = messages.length;
      
      // Auto-scroll if user hasn't manually scrolled away or is near bottom
      if (autoscroll && (!userHasScrolled || isNearBottom)) {
        await tick(); // Wait for DOM update
        scrollToBottom();
      }
    }
  });

  function handleScroll(): void {
    if (!scroller) return;
    
    const threshold = 100; // pixels from bottom
    const scrollTop = scroller.scrollTop;
    const scrollHeight = scroller.scrollHeight;
    const clientHeight = scroller.clientHeight;
    
    isNearBottom = scrollHeight - scrollTop - clientHeight < threshold;
    
    // If user scrolled up significantly, mark as manually scrolled
    if (!isNearBottom && scrollHeight - scrollTop - clientHeight > threshold * 2) {
      userHasScrolled = true;
    }
    
    // Reset manual scroll flag if user scrolls back to bottom
    if (isNearBottom) {
      userHasScrolled = false;
    }
  }

  function scrollToBottom(immediate: boolean = false): void {
    if (!scroller) return;
    const behavior: ScrollBehavior = immediate ? 'auto' : 'smooth';
    scroller.scrollTo({ top: scroller.scrollHeight, behavior });
    userHasScrolled = false;
  }

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

<div class="overflow-y-auto h-full pr-2" bind:this={scroller} on:scroll={handleScroll} aria-label={"Conversation"}>
  <div class="flex flex-col gap-2 p-4 pb-6">
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


