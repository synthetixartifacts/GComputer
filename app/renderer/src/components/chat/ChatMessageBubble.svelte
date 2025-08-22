<script lang="ts">
  import type { ChatMessage } from '@features/chatbot/types';
  import { t } from '@ts/i18n';

  export let message: ChatMessage;
  export let showAvatar: boolean = true;
  export let isFirstInGroup: boolean = true;
  export let isLastInGroup: boolean = true;

  const isUser = message.role === 'user';
  let showCopyButton: boolean = false;
  let isCopied: boolean = false;
  let copyTimeout: NodeJS.Timeout | null = null;
  
  // Reactive translation using store subscription
  $: copyButtonText = isCopied ? $t('styleguide.chatbot.messages.Copied') : $t('styleguide.chatbot.messages.Copy');

  function timeFromIso(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  async function copyToClipboard(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    event.preventDefault();
    
    try {
      await navigator.clipboard.writeText(message.content);
      isCopied = true;
      
      // Reset after 2 seconds
      if (copyTimeout) clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => {
        isCopied = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = message.content;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        isCopied = true;
        if (copyTimeout) clearTimeout(copyTimeout);
        copyTimeout = setTimeout(() => {
          isCopied = false;
        }, 2000);
      } catch (err2) {
        console.error('Fallback copy failed:', err2);
      }
      document.body.removeChild(textArea);
    }
  }

  function handleMouseEnter(): void {
    showCopyButton = true;
  }

  function handleMouseLeave(): void {
    // Keep button visible if it says "Copied"
    if (!isCopied) {
      showCopyButton = false;
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

<div class={`w-full flex ${outerJustify}`} role="article" on:mouseenter={handleMouseEnter} on:mouseleave={handleMouseLeave}>
  <div class={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`} aria-label={isUser ? 'User' : 'Assistant'}>
    {#if showAvatar}
      <div class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-gray-300 text-xs text-gray-700 dark:bg-gray-600 dark:text-gray-100" aria-hidden="true">
        {#if isUser}U{:else}A{/if}
      </div>
    {/if}

    <div class="max-w-[75%] md:max-w-[66%] lg:max-w-[60%] relative">
      <div class={`px-3 py-2 ${bubbleBg} ${cornerClasses}`}>
        <p class="whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
      
      {#if showCopyButton || isCopied}
        <button
          class="absolute top-1 right-1 px-2 py-1 text-xs rounded 
                 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                 text-gray-600 dark:text-gray-400 transition-all duration-200
                 shadow-sm hover:shadow opacity-90 hover:opacity-100"
          style="transform: translateY(-2px);"
          on:click={(e) => copyToClipboard(e)}
          aria-label="Copy message"
        >
          {copyButtonText}
        </button>
      {/if}
      
      <div class={`mt-1 text-[11px] opacity-60 ${isUser ? 'text-right' : 'text-left'}`}>
        {timeFromIso(message.createdAtIso)}
      </div>
    </div>
  </div>
  
</div>


