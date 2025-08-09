<script lang="ts">
  import NavTree from '@components/NavTree.svelte';
  import { menuItems } from '@features/navigation/store';
  import type { MenuItem } from '@features/navigation/types';
  import { onDestroy } from 'svelte';

  export let open: boolean = false;
  export let onClose: () => void;
  let items: MenuItem[] = [];
  const unsubscribe = menuItems.subscribe((v) => (items = v));
  onDestroy(() => unsubscribe());
</script>

{#if open}
  <button class="gc-sidebar-backdrop" on:click={onClose} aria-label="Close sidebar backdrop"></button>
{/if}

<aside class="gc-sidebar {open ? 'gc-sidebar--open' : ''}" aria-hidden={!open}>
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-base font-semibold">Menu</h2>
    <button class="btn gc-icon-btn" on:click={onClose} aria-label="Close sidebar">✕</button>
  </div>
  <nav class="grid gap-2">
    <NavTree items={items} onNavigate={onClose} />
  </nav>
</aside>
