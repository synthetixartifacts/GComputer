<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { ChatMessage } from '@features/chatbot/types';
  import { chatbotStore } from '@features/chatbot/store';
  import { sendMessage } from '@features/chatbot/service';
  import ChatMessageList from './ChatMessageList.svelte';
  import ChatComposer from './ChatComposer.svelte';

  export let threadId: string;
  export let customSendHandler: ((text: string) => Promise<void>) | null = null;

  let messages: ChatMessage[] = [];

  const unsub = chatbotStore.subscribe((state) => {
    const thread = state.threads[threadId];
    messages = thread ? thread.messages : [];
  });
  onDestroy(() => unsub());

  async function handleSend(text: string): Promise<void> {
    if (customSendHandler) {
      await customSendHandler(text);
    } else {
      await sendMessage({ threadId, content: text });
    }
  }
</script>

<section class="h-full grid grid-rows-[1fr_auto]">
  <div class="min-h-0">
    <ChatMessageList {messages} />
  </div>
  <div class="mt-3">
    <ChatComposer onSend={handleSend} />
  </div>
  
</section>


