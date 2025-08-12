<script lang="ts">
  /** Simple view toggle between 'list' and 'grid' */
  import { createEventDispatcher } from 'svelte';
  export let mode: 'list' | 'grid' = 'list';
  const dispatch = createEventDispatcher<{ change: { mode: 'list'|'grid' } }>();
</script>

<div class="flex items-center gap-2">
  <button class="btn btn--secondary btn--sm" aria-pressed={mode === 'list'} on:click={() => dispatch('change', { mode: 'list' })}>List</button>
  <button class="btn btn--secondary btn--sm" aria-pressed={mode === 'grid'} on:click={() => dispatch('change', { mode: 'grid' })}>Grid</button>
</div>


