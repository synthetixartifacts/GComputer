<script lang="ts">
  import { onDestroy } from 'svelte';
  import { t as tStore } from '@ts/i18n/store';

  export let value: string = '';
  export let disabled: boolean = false;
  export let onSend: (text: string) => void;
  
  // Translation key overrides for different contexts
  export let placeholderKey: string = 'pages.styleguide.chatbot.composer.placeholder';
  export let inputLabelKey: string = 'pages.styleguide.chatbot.composer.inputLabel';
  export let sendKey: string = 'pages.styleguide.chatbot.composer.send';

  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());

  function handleKeydown(event: KeyboardEvent): void {
    if (disabled) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      trySend();
    }
  }

  let textareaRef: HTMLTextAreaElement | null = null;

  function trySend(): void {
    const trimmed = (value ?? '').trim();
    if (trimmed.length === 0) return;
    onSend?.(trimmed);
    value = '';
    // Restore focus for fast iterative sending
    textareaRef?.focus();
  }
</script>

<div>
  <div class="flex items-end gap-2">
    <textarea
      class="flex-1 resize-none rounded-md border px-3 py-2 leading-relaxed bg-white dark:bg-gray-800"
      rows="1"
      placeholder={t(placeholderKey)}
      bind:value
      on:keydown={handleKeydown}
      disabled={disabled}
      aria-label={t(inputLabelKey)}
      bind:this={textareaRef}
    ></textarea>
    <button
      type="button"
      class="btn btn--primary"
      aria-label={t(sendKey)}
      on:click={trySend}
      disabled={disabled}
    >{t(sendKey)}</button>
  </div>
</div>


