<script lang="ts">
  export let onToggleSidebar: () => void;
  import { t as tStore } from '@ts/i18n/store';
  import { pageTitle, pageActions } from '@features/ui/store';
  import type { PageAction } from '@features/ui/types';
  import { onMount, onDestroy } from 'svelte';

  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  let currentTitle: string = '';
  let currentActions: PageAction[] = [];

  const unsubT = tStore.subscribe((fn) => (t = fn));
  const unsubTitle = pageTitle.subscribe((title) => (currentTitle = title));
  const unsubActions = pageActions.subscribe((actions) => (currentActions = actions));

  // Header hide/show on scroll
  let headerEl: HTMLElement | null = null;
  let isHidden = false;
  const SHOW_UP_DELTA = 100; // show header after scrolling up by >= 100px
  const HIDE_SCROLL_Y = 120; // allow hiding once scrolled past this Y

  let lastY = 0;
  let upDelta = 0;

  function updateHeaderOffset() {
    if (!headerEl) return;
    const h = headerEl.offsetHeight;
    document.documentElement.style.setProperty('--gc-header-offset', `${h}px`);
  }

  function onScroll() {
    const y = window.scrollY;
    const dy = y - lastY;

    if (y <= 0) {
      isHidden = false;
      upDelta = 0;
      lastY = y;
      return;
    }

    if (dy > 0) {
      // scrolling down
      upDelta = 0;
      if (y > HIDE_SCROLL_Y) {
        isHidden = true;
      }
    } else if (dy < 0) {
      // scrolling up
      upDelta += -dy; // accumulate upward distance
      if (upDelta >= SHOW_UP_DELTA) {
        isHidden = false;
        // keep a bit of hysteresis by resetting accumulator
        upDelta = 0;
      }
    }

    lastY = y;
  }

  let ro: ResizeObserver | null = null;

  onMount(() => {
    lastY = window.scrollY;
    updateHeaderOffset();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateHeaderOffset, { passive: true } as any);
    if (headerEl && 'ResizeObserver' in window) {
      ro = new ResizeObserver(() => updateHeaderOffset());
      ro.observe(headerEl);
    }
  });

  onDestroy(() => {
    window.removeEventListener('scroll', onScroll as EventListener);
    window.removeEventListener('resize', updateHeaderOffset as any);
    ro?.disconnect();
    unsubT();
    unsubTitle();
    unsubActions();
  });
</script>

<header class="gc-header" bind:this={headerEl} class:gc-header--hidden={isHidden}>
  <div class="gc-header__inner">
    <div class="gc-header__left">
      <button class="btn btn--secondary gc-icon-btn" on:click={onToggleSidebar} aria-label={t('app.actions.toggleSidebar')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
          <path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z" />
        </svg>
      </button>
    </div>
    <div class="gc-header__center">
      <h1 class="text-lg font-semibold">
        {#if currentTitle}
          {t(currentTitle)}
        {:else}
          {t('app.title')}
        {/if}
      </h1>
    </div>
    <div class="gc-header__right">
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
  </div>
</header>
