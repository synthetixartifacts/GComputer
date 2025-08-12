<script lang="ts">
  /**
   * Accessible modal dialog.
   *
   * Props:
   * - open: whether the modal is visible
   * - onClose: callback invoked to close the modal
   * - title: i18n key used for heading and labelling
   *
   * Behavior: focus is trapped while open and returned to the opener on close.
   */
  export let open: boolean = false;
  export let onClose: () => void;
  export let title: string = 'pages.styleguide.modalTitle';
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy, tick } from 'svelte';
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));

  let dialogEl: HTMLDivElement | null = null;
  let headingId: string = 'gc-modal-title-' + Math.random().toString(36).slice(2);
  let previouslyFocusedEl: HTMLElement | null = null;

  function getFocusable(container: HTMLElement): HTMLElement[] {
    const nodes = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    return Array.from(nodes).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);
  }

  async function handleOpenChanged(): Promise<void> {
    if (open && dialogEl) {
      previouslyFocusedEl = (document.activeElement as HTMLElement) ?? null;
      await tick();
      const focusables = getFocusable(dialogEl);
      (focusables[0] ?? dialogEl).focus();
    } else if (!open && previouslyFocusedEl) {
      previouslyFocusedEl.focus();
      previouslyFocusedEl = null;
    }
  }
  $: open, handleOpenChanged();

  function onKeyDown(e: KeyboardEvent): void {
    if (!dialogEl) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose?.();
      return;
    }
    if (e.key === 'Tab') {
      const focusables = getFocusable(dialogEl);
      if (focusables.length === 0) {
        e.preventDefault();
        (dialogEl as HTMLElement).focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const isShift = e.shiftKey;
      const active = document.activeElement as HTMLElement;
      if (!isShift && active === last) {
        e.preventDefault();
        first.focus();
      } else if (isShift && active === first) {
        e.preventDefault();
        last.focus();
      }
    }
  }

  onDestroy(() => unsubT());
</script>

{#if open}
  <div class="gc-modal" role="dialog" aria-modal="true" aria-labelledby={headingId} on:keydown={onKeyDown} tabindex="-1">
    <button class="gc-modal-backdrop" on:click={onClose} aria-label={`${t('app.menu.close')} backdrop`}></button>
    <div class="gc-modal__dialog" tabindex="-1" bind:this={dialogEl}>
      <div class="flex items-center justify-between mb-3">
        <h3 id={headingId} class="text-base font-semibold">{t(title)}</h3>
        <button class="btn btn--secondary gc-icon-btn" on:click={onClose} aria-label={t('app.menu.close')}>
          ✕
        </button>
      </div>
      <slot />
    </div>
  </div>
{/if}


