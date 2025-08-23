<script lang="ts">
  export let onToggleSidebar: () => void;
  import { t as tStore } from '@ts/i18n/store';
  import { pageTitle, pageActions } from '@features/ui/store';
  import type { PageAction } from '@features/ui/types';
  
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  let currentTitle: string = '';
  let currentActions: PageAction[] = [];
  
  const unsubT = tStore.subscribe((fn) => (t = fn));
  const unsubTitle = pageTitle.subscribe((title) => (currentTitle = title));
  const unsubActions = pageActions.subscribe((actions) => (currentActions = actions));
  
  import { onDestroy } from 'svelte';
  onDestroy(() => {
    unsubT();
    unsubTitle();
    unsubActions();
  });
</script>

<header class="gc-header">
  <div class="flex items-center gap-2">
    <button class="btn btn--secondary gc-icon-btn" on:click={onToggleSidebar} aria-label={t('app.actions.toggleSidebar')}>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
        <path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z" />
      </svg>
    </button>
    <h1 class="text-lg font-semibold">
      {#if currentTitle}
        {t(currentTitle)}
      {:else}
        {t('app.title')}
      {/if}
    </h1>
  </div>
  <div class="flex items-center gap-2">
    {#each currentActions as action (action.id)}
      <button 
        class="btn btn--secondary gc-icon-btn {action.className || ''}"
        on:click={action.onClick}
        aria-label={action.ariaLabel}
      >
        {#if action.emoji}
          {action.emoji}
        {:else if action.icon}
          {@html action.icon}
        {:else if action.label}
          <span class="px-2">{action.label}</span>
        {/if}
      </button>
    {/each}
  </div>
</header>
