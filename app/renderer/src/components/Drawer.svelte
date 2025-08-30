<script lang="ts">
  /**
   * Side drawer panel with backdrop and basic focus containment.
   *
   * Props:
   * - open: whether the drawer is visible
   * - onClose: callback to request closing
   * - title: plain text heading displayed in the panel
   */
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy } from 'svelte';
  import { lockBodyScroll, unlockBodyScroll } from '@renderer/ts/shared/utils/scroll-lock';
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());
  export let open: boolean = false;
  export let onClose: () => void = () => {};
  export let title: string = '';
  let panelEl: HTMLElement | null = null;
  let headingId: string = 'gc-drawer-title-' + Math.random().toString(36).slice(2);
  let previouslyFocusedEl: HTMLElement | null = null;

  // Handle scroll lock when drawer opens/closes
  $: if (open) {
    lockBodyScroll();
  } else {
    unlockBodyScroll();
  }

  onDestroy(() => {
    // Ensure we release the lock if unmounting while open
    if (open) {
      unlockBodyScroll();
    }
  });

  function getFocusable(container: HTMLElement): HTMLElement[] {
    const nodes = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    return Array.from(nodes).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (!open || !panelEl) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose?.();
      return;
    }
    if (e.key === 'Tab') {
      const focusables = getFocusable(panelEl);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const isShift = e.shiftKey;
      const active = document.activeElement as HTMLElement;
      if (!isShift && active === last) { e.preventDefault(); first.focus(); }
      else if (isShift && active === first) { e.preventDefault(); last.focus(); }
    }
  }
</script>

{#if open}
  <button class="gc-sidebar-backdrop" on:click={onClose} aria-label={(title || 'Drawer') + ' backdrop'}></button>
{/if}

<aside class="gc-sidebar {open ? 'gc-sidebar--open' : ''}" aria-hidden={!open} aria-labelledby={headingId} tabindex="-1" bind:this={panelEl} on:keydown={onKeyDown}>
  <div class="flex items-center justify-between mb-4">
    {#if title}
      <h2 id={headingId} class="text-base font-semibold">{title}</h2>
    {/if}
    <button class="btn btn--secondary gc-icon-btn" on:click={onClose} aria-label={t('common.actions.close')}>✕</button>
  </div>
  <div class="grid gap-2">
    <slot />
  </div>
  <div class="mt-4">
    <slot name="footer" />
  </div>
  
</aside>
