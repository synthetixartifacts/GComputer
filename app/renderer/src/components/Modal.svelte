<script lang="ts">
  export let open: boolean = false;
  export let onClose: () => void;
  export let title: string = 'Modal Title';
  import { t as tStore } from '@features/i18n/store';
  $: t = $tStore;
</script>

{#if open}
  <div class="gc-modal" role="dialog" aria-modal="true" aria-label={title}>
    <button class="gc-modal-backdrop" on:click={onClose} aria-label={`${t('app.menu.close')} backdrop`}></button>
    <div class="gc-modal__dialog">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-base font-semibold">{title}</h3>
        <button class="btn btn--secondary gc-icon-btn" on:click={onClose} aria-label={t('app.menu.close')}>
          ✕
        </button>
      </div>
      <slot />
    </div>
  </div>
{/if}


