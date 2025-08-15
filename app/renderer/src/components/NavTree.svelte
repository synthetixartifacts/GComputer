<script lang="ts">
  /**
   * Recursive navigation tree component.
   *
   * Props:
   * - items: menu items to render
   * - onNavigate: callback after a leaf navigation is performed
   * - currentRoute (optional): control the active route (fallback to store)
   * - expanded (optional): control expanded state map (fallback to store)
   * - onToggleExpand (optional): callback(label, next) for controlled expand
   * - onNavigateRoute (optional): callback(route) for controlled navigation
   */
  import type { MenuItem } from '@features/navigation/types';
  import { expandedKeys, effectiveExpanded, activeRoute } from '@features/navigation/store';
  import { toggleExpanded } from '@features/navigation/service';
  import { navigate } from '@features/router/service';
  import type { Route } from '@features/router/types';
  import { t as tStore } from '@ts/i18n/store';

  export let items: MenuItem[] = [];
  export let onNavigate: () => void = () => {};
  // Controlled props (optional)
  export let currentRoute: Route | undefined = undefined;
  export let expanded: Record<string, boolean> | undefined = undefined;
  export let onToggleExpand: ((label: string, next: boolean) => void) | undefined = undefined;
  export let onNavigateRoute: ((route: Route) => void) | undefined = undefined;

  let storeCurrentRoute: Route = 'home';
  let storeExpandedState: Record<string, boolean> = {};
  const unsubRoute = activeRoute.subscribe((v) => (storeCurrentRoute = v));
  const unsubExpanded = effectiveExpanded.subscribe((v) => (storeExpandedState = v));
  import { onDestroy } from 'svelte';
  onDestroy(() => { unsubRoute(); unsubExpanded(); });

  $: resolvedRoute = currentRoute ?? storeCurrentRoute;
  $: resolvedExpanded = expanded ?? storeExpandedState;

  function toggle(label: string): void {
    const next = !resolvedExpanded[label];
    if (onToggleExpand) {
      onToggleExpand(label, next);
      return;
    }
    toggleExpanded(label);
  }

  function handleClick(item: MenuItem): void {
    if (item.children && item.children.length > 0) {
      toggle(item.label);
      return;
    }
    if (item.route) {
      if (onNavigateRoute) {
        onNavigateRoute(item.route as Route);
      } else {
        navigate(item.route as Route);
      }
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
        class="nav-item {item.children ? 'has-children' : ''} {item.route === resolvedRoute ? 'active' : ''}"
        on:click={() => handleClick(item)}
        aria-expanded={item.children ? !!resolvedExpanded[item.label] : undefined}
        aria-current={item.route === resolvedRoute ? 'page' : undefined}
      >
        {#if item.children}
          <span class="chevron {resolvedExpanded[item.label] ? 'open' : ''}">▸</span>
        {/if}
        <span class="label">{item.i18nKey ? t(item.i18nKey) : item.label}</span>
      </button>
      {#if item.children && resolvedExpanded[item.label]}
        <div class="children">
          <svelte:self items={item.children} onNavigate={onNavigate} />
        </div>
      {/if}
    </li>
  {/each}
  
</ul>

 


