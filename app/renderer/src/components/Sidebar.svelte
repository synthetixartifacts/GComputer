<script lang="ts">
  export let open: boolean = false;
  export let onClose: () => void;
</script>

{#if open}
  <button class="gc-sidebar-backdrop" on:click={onClose} aria-label="Close sidebar backdrop"></button>
{/if}

<aside class="gc-sidebar {open ? 'gc-sidebar--open' : ''}" aria-hidden={!open}>
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-base font-semibold">Sidebar</h2>
    <button class="btn gc-icon-btn" on:click={onClose} aria-label="Close sidebar">✕</button>
  </div>
  <nav class="grid gap-2">
    <a class="btn btn--link" href="#/" on:click={onClose}>Home</a>
    <a class="btn btn--link" href="#/about" on:click={onClose}>About</a>
    <a class="btn btn--link" href="#/styleguide" on:click={onClose}>Styleguide</a>
  </nav>
</aside>

<style>
</style>


