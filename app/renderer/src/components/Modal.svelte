<script lang="ts">
  export let open: boolean = false;
  export let onClose: () => void;
  export let title: string = 'Modal Title';
</script>

{#if open}
  <div class="gc-modal" role="dialog" aria-modal="true">
    <button class="gc-modal-backdrop" on:click={onClose} aria-label="Close modal backdrop"></button>
    <div class="gc-modal__dialog">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-base font-semibold">{title}</h3>
        <button class="btn btn--secondary gc-icon-btn" on:click={onClose} aria-label="Close modal">
          ✕
        </button>
      </div>
      <slot />
    </div>
  </div>
{/if}

<style>
</style>


