<script lang="ts">
  import type { MenuItem } from '@features/navigation/types';
  import { expandedKeys, effectiveExpanded, activeRoute } from '@features/navigation/store';
  import { toggleExpanded } from '@features/navigation/service';
  import { navigate } from '@features/router/service';
  import type { Route } from '@features/router/types';
  import { t as tStore } from '@ts/i18n/store';

  export let items: MenuItem[] = [];
  export let onNavigate: () => void = () => {};
  let currentRoute: Route = 'home';
  let expandedState: Record<string, boolean> = {};
  const unsubRoute = activeRoute.subscribe((v) => (currentRoute = v));
  const unsubExpanded = effectiveExpanded.subscribe((v) => (expandedState = v));
  import { onDestroy } from 'svelte';
  onDestroy(() => { unsubRoute(); unsubExpanded(); });

  function toggle(label: string): void {
    toggleExpanded(label);
  }

  function handleClick(item: MenuItem): void {
    if (item.children && item.children.length > 0) {
      toggle(item.label);
      return;
    }
    if (item.route) {
      navigate(item.route);
      onNavigate();
    }
  }

  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());
</script>

<ul class="nav-tree">
  {#each items as item}
    <li>
      <button
        type="button"
        class="nav-item {item.children ? 'has-children' : ''} {item.route === currentRoute ? 'active' : ''}"
        on:click={() => handleClick(item)}
        aria-expanded={item.children ? !!expandedState[item.label] : undefined}
        aria-current={item.route === currentRoute ? 'page' : undefined}
      >
        {#if item.children}
          <span class="chevron {expandedState[item.label] ? 'open' : ''}">▸</span>
        {/if}
        <span class="label">{item.i18nKey ? t(item.i18nKey) : item.label}</span>
      </button>
      {#if item.children && expandedState[item.label]}
        <div class="children">
          <svelte:self items={item.children} onNavigate={onNavigate} />
        </div>
      {/if}
    </li>
  {/each}
  
</ul>

 


