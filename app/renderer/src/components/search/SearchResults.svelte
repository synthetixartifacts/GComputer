<script lang="ts">
  import type { SearchItem } from '@features/search/types';

  export let results: SearchItem[] = [];
  export let loading: boolean = false;
  export let highlightQuery: string = '';
  export let emptyLabel: string = 'No results';
  export let countLabel: (n: number) => string = (n) => `${n} results`;

  function highlight(text: string): string {
    const q = highlightQuery.trim();
    if (!q) return text;
    try {
      const re = new RegExp(`(${escapeRegExp(q)})`, 'ig');
      return text.replace(re, '<mark>$1</mark>');
    } catch {
      return text;
    }
  }

  function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
</script>

<div class="grid gap-2">
  {#if loading}
    <div class="text-sm opacity-60">Loading…</div>
  {:else if results.length === 0}
    <div class="text-sm opacity-60">{emptyLabel}</div>
  {:else}
    <div class="text-sm opacity-60">{countLabel(results.length)}</div>
    <ul class="divide-y divide-neutral-200 dark:divide-neutral-800 rounded-md border">
      {#each results as r}
        <li class="p-3">
          <div class="flex items-start justify-between gap-3">
            <div class="grid gap-1">
              <div class="font-medium">{@html highlight(r.title)}</div>
              {#if r.subtitle}
                <div class="text-sm opacity-80">{@html highlight(r.subtitle)}</div>
              {/if}
              {#if r.description}
                <div class="text-sm opacity-70">{@html highlight(r.description)}</div>
              {/if}
              {#if r.tags && r.tags.length > 0}
                <div class="flex flex-wrap gap-1 mt-1">
                  {#each r.tags as tag}
                    <span class="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800">{tag}</span>
                  {/each}
                </div>
              {/if}
            </div>
            {#if r.type}
              <span class="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800">{r.type}</span>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>


