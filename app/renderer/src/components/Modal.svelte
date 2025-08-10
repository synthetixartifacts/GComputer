<script lang="ts">
  export let open: boolean = false;
  export let onClose: () => void;
  export let title: string = 'app.pages.styleguide.modalTitle';
  import { t as tStore } from '@ts/i18n/store';
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  import { onDestroy } from 'svelte';
  onDestroy(() => unsubT());
</script>

{#if open}
  <div class="gc-modal" role="dialog" aria-modal="true" aria-label={t(title)}>
    <button class="gc-modal-backdrop" on:click={onClose} aria-label={`${t('app.menu.close')} backdrop`}></button>
    <div class="gc-modal__dialog">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-base font-semibold">{t(title)}</h3>
        <button class="btn btn--secondary gc-icon-btn" on:click={onClose} aria-label={t('app.menu.close')}>
          ✕
        </button>
      </div>
      <slot />
    </div>
  </div>
{/if}


