<script lang="ts">
  import type { ChatMessage } from '@features/chatbot/types';
  import ChatMessageBubble from './ChatMessageBubble.svelte';
  import { afterUpdate, onMount } from 'svelte';

  export let messages: ChatMessage[] = [];
  export let autoscroll: boolean = true;
  export let groupThresholdMs: number = 3 * 60 * 1000; // 3 min grouping window

  let scroller: HTMLDivElement | null = null;

  onMount(() => {
    if (autoscroll) scrollToBottom(true);
  });

  afterUpdate(() => {
    if (autoscroll) scrollToBottom();
  });

  function scrollToBottom(immediate: boolean = false): void {
    if (!scroller) return;
    const behavior: ScrollBehavior = immediate ? 'auto' : 'smooth';
    scroller.scrollTo({ top: scroller.scrollHeight, behavior });
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

<div class="overflow-y-auto h-full pr-2" bind:this={scroller} aria-label={"Conversation"}>
  <div class="flex flex-col gap-2">
    {#each messages as msg, i (msg.id)}
      <ChatMessageBubble
        message={msg}
        showAvatar={isFirstInGroup(i)}
        isFirstInGroup={isFirstInGroup(i)}
        isLastInGroup={isLastInGroup(i)}
      />
    {/each}
  </div>
</div>


