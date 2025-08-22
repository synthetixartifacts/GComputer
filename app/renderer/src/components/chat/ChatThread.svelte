<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { ChatMessage } from '@features/chatbot/types';
  import { chatbotStore } from '@features/chatbot/store';
  import { sendMessage } from '@features/chatbot/service';
  import ChatMessageList from './ChatMessageList.svelte';
  import ChatComposer from './ChatComposer.svelte';

  export let threadId: string;
  export let customSendHandler: ((text: string) => Promise<void>) | null = null;
  
  // Translation key props for different contexts
  export let copyKey: string = 'pages.styleguide.chatbot.messages.Copy';
  export let copiedKey: string = 'pages.styleguide.chatbot.messages.Copied';
  export let placeholderKey: string = 'pages.styleguide.chatbot.composer.placeholder';
  export let inputLabelKey: string = 'pages.styleguide.chatbot.composer.inputLabel';
  export let sendKey: string = 'pages.styleguide.chatbot.composer.send';

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

<section class="h-full flex flex-col">
  <div class="flex-1 min-h-0 overflow-hidden">
    <ChatMessageList {messages} {copyKey} {copiedKey} />
  </div>
  <div class="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-3 z-10">
    <ChatComposer onSend={handleSend} {placeholderKey} {inputLabelKey} {sendKey} />
  </div>
</section>


