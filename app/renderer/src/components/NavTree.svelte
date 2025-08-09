<script lang="ts">
  import type { MenuItem } from '@features/navigation/types';
  import { expandedKeys, effectiveExpanded, activeRoute } from '@features/navigation/store';
  import { navigate } from '@features/router/service';
  import type { Route } from '@features/router/types';

  export let items: MenuItem[] = [];
  export let onNavigate: () => void = () => {};
  let currentRoute: Route = 'home';
  let expandedState: Record<string, boolean> = {};
  const unsubRoute = activeRoute.subscribe((v) => (currentRoute = v));
  const unsubExpanded = effectiveExpanded.subscribe((v) => (expandedState = v));
  import { onDestroy } from 'svelte';
  onDestroy(() => { unsubRoute(); unsubExpanded(); });

  function isExpanded(label: string): boolean {
    return !!expandedState[label];
  }

  function toggle(label: string): void {
    expandedKeys.update((v) => ({ ...v, [label]: !v[label] }));
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
</script>

<ul class="nav-tree">
  {#each items as item}
    <li>
      <button
        class="nav-item {item.children ? 'has-children' : ''} {item.route === currentRoute ? 'active' : ''}"
        on:click={() => handleClick(item)}
        aria-expanded={item.children ? isExpanded(item.label) : undefined}
        aria-current={item.route === currentRoute ? 'page' : undefined}
      >
        {#if item.children}
          <span class="chevron {isExpanded(item.label) ? 'open' : ''}">▸</span>
        {/if}
        <span class="label">{item.label}</span>
      </button>
      {#if item.children && isExpanded(item.label)}
        <div class="children">
          <svelte:self items={item.children} onNavigate={onNavigate} />
        </div>
      {/if}
    </li>
  {/each}
  
</ul>

 


