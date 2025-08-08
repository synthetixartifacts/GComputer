<script lang="ts">
  import { onDestroy } from 'svelte';
  import { pathStore, itemsStore, browse } from '@features/browse/store';
  import type { BrowseItem } from '@features/browse/types';

  let pathValue: string = '';
  let items: BrowseItem[] = [];

  const unsubPath = pathStore.subscribe((v) => (pathValue = v));
  const unsubItems = itemsStore.subscribe((v) => (items = v));
  onDestroy(() => {
    unsubPath();
    unsubItems();
  });

  function onPathInput(event: Event) {
    const input = event.target as HTMLInputElement;
    pathStore.set(input.value);
  }
</script>

<div class="space-y-4">
  <div class="flex items-center gap-2 justify-center">
    <input class="border rounded px-3 py-2 w-64" value={pathValue} on:input={onPathInput} placeholder="Path..." />
    <button class="button" on:click={browse}>Browse</button>
  </div>

  {#if items.length}
    <ul class="bg-white rounded border divide-y">
      {#each items as it}
        <li class="px-4 py-2">{it.dir ? '📁' : '📄'} {it.name}</li>
      {/each}
    </ul>
  {/if}
</div>


