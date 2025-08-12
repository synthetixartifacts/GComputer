<script lang="ts">
  export let open: boolean = false;
  export let onClose: () => void = () => {};
  export let title: string = '';
</script>

{#if open}
  <button class="gc-sidebar-backdrop" on:click={onClose} aria-label={(title || 'Drawer') + ' backdrop'}></button>
{/if}

<aside class="gc-sidebar {open ? 'gc-sidebar--open' : ''}" aria-hidden={!open} aria-label={title || 'Drawer'}>
  <div class="flex items-center justify-between mb-4">
    {#if title}
      <h2 class="text-base font-semibold">{title}</h2>
    {/if}
    <button class="btn gc-icon-btn" on:click={onClose} aria-label="Close">✕</button>
  </div>
  <div class="grid gap-2">
    <slot />
  </div>
  <div class="mt-4">
    <slot name="footer" />
  </div>
  
</aside>


