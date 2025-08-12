<script lang="ts">
  import type { ChatMessage } from '@features/chatbot/types';

  export let message: ChatMessage;
  export let showAvatar: boolean = true;
  export let isFirstInGroup: boolean = true;
  export let isLastInGroup: boolean = true;

  const isUser = message.role === 'user';

  function timeFromIso(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  $: bubbleBg = isUser
    ? 'bg-blue-600 text-white'
    : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100';

  $: outerJustify = isUser ? 'justify-end' : 'justify-start';

  $: cornerClasses = isUser
    ? `${isFirstInGroup ? 'rounded-tr-2xl' : 'rounded-tr-md'} ${isLastInGroup ? 'rounded-br-2xl' : 'rounded-br-md'} rounded-tl-2xl rounded-bl-2xl`
    : `${isFirstInGroup ? 'rounded-tl-2xl' : 'rounded-tl-md'} ${isLastInGroup ? 'rounded-bl-2xl' : 'rounded-bl-md'} rounded-tr-2xl rounded-br-2xl`;
</script>

<div class={`w-full flex ${outerJustify}`}>
  <div class={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`} aria-label={isUser ? 'User' : 'Assistant'}>
    {#if showAvatar}
      <div class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-gray-300 text-xs text-gray-700 dark:bg-gray-600 dark:text-gray-100" aria-hidden="true">
        {#if isUser}U{:else}A{/if}
      </div>
    {/if}

    <div class="max-w-[75%] md:max-w-[66%] lg:max-w-[60%]">
      <div class={`px-3 py-2 ${bubbleBg} ${cornerClasses}`}>
        <p class="whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
      <div class={`mt-1 text-[11px] opacity-60 ${isUser ? 'text-right' : 'text-left'}`}>
        {timeFromIso(message.createdAtIso)}
      </div>
    </div>
  </div>
  
</div>


