<script lang="ts">
  import { onDestroy } from 'svelte';
  import { t as tStore } from '@ts/i18n/store';
  import ChatThread from '@components/chat/ChatThread.svelte';
  import { chatbotStore } from '@features/chatbot/store';
  import { nowIso, generateId } from '@features/chatbot/service';

  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());

  const threadId = 'styleguide-demo';
  chatbotStore.setActiveThread(threadId);
  // Seed additional demo messages for a richer thread
  chatbotStore.replaceThreadMessages(threadId, [
    { id: generateId('assistant'), role: 'assistant', content: 'Welcome to the Chatbot demo. Ask me anything!', createdAtIso: nowIso() },
    { id: generateId('user'), role: 'user', content: 'Hello! Can you summarize what this demo shows?', createdAtIso: nowIso() },
    { id: generateId('assistant'), role: 'assistant', content: 'It demonstrates a reusable chat thread UI: message bubbles, list with autoscroll, and a composer.', createdAtIso: nowIso() },
  ]);
</script>

<section class="container-page stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.styleguide.chatbot.title')}</h2>
  <p class="text-sm opacity-80">{t('pages.styleguide.chatbot.desc')}</p>
  <div class="border rounded-md p-3 h-[540px] md:h-[640px]" role="region" aria-label={t('pages.styleguide.chatbot.conversationLabel')}>
    <ChatThread threadId={threadId} />
  </div>
</section>


