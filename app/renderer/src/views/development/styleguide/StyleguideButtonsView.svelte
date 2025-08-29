<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy } from 'svelte';

  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());

  function noop(): void {}
</script>

<section class="stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.styleguide.buttons.title')}</h2>
  <p class="opacity-80">{t('pages.styleguide.buttons.desc')}</p>

  <div class="stack-md">
    <h3 class="text-lg font-semibold">{t('pages.styleguide.buttons.variants')}</h3>
    <div class="flex flex-wrap gap-2 items-center">
      <button class="btn btn--primary" on:click={noop}>{t('pages.styleguide.buttons.primary')}</button>
      <button class="btn btn--secondary" on:click={noop}>{t('pages.styleguide.buttons.secondary')}</button>
      <button class="btn btn--danger" on:click={noop}>{t('pages.styleguide.buttons.danger')}</button>
      <a class="btn btn--link" href="#/development/styleguide/buttons">{t('pages.styleguide.buttons.link')}</a>
    </div>
  </div>

  <div class="stack-md">
    <h3 class="text-lg font-semibold">{t('pages.styleguide.buttons.states')}</h3>
    <div class="flex flex-wrap gap-2 items-center">
      <button class="btn btn--primary" disabled>{t('pages.styleguide.buttons.disabled')}</button>
      <button class="btn btn--secondary" disabled>{t('pages.styleguide.buttons.disabled')}</button>
      <a class="btn btn--link pointer-events-none opacity-60" href="#/development/styleguide/buttons" aria-disabled="true">{t('pages.styleguide.buttons.disabled')}</a>
    </div>
  </div>

  <div class="stack-md">
    <h3 class="text-lg font-semibold">{t('pages.styleguide.buttons.sizes')}</h3>
    <div class="flex flex-wrap gap-2 items-center">
      <button class="btn btn--primary btn--sm">{t('pages.styleguide.buttons.primary')} — {t('pages.styleguide.buttons.small')}</button>
      <button class="btn btn--primary">{t('pages.styleguide.buttons.primary')} — {t('pages.styleguide.buttons.medium')}</button>
      <button class="btn btn--primary btn--lg">{t('pages.styleguide.buttons.primary')} — {t('pages.styleguide.buttons.large')}</button>
    </div>
    <div class="flex flex-wrap gap-2 items-center">
      <button class="btn btn--secondary btn--sm">{t('pages.styleguide.buttons.secondary')} — {t('pages.styleguide.buttons.small')}</button>
      <button class="btn btn--secondary">{t('pages.styleguide.buttons.secondary')} — {t('pages.styleguide.buttons.medium')}</button>
      <button class="btn btn--secondary btn--lg">{t('pages.styleguide.buttons.secondary')} — {t('pages.styleguide.buttons.large')}</button>
    </div>
  </div>

  <div class="stack-md">
    <h3 class="text-lg font-semibold">{t('pages.styleguide.buttons.withIcons')}</h3>
    <div class="flex flex-wrap gap-2 items-center">
      <button class="btn btn--primary inline-flex items-center gap-2" aria-busy="true">
        <span class="spinner" aria-hidden="true"></span>
        <span>{t('pages.styleguide.buttons.loading')}</span>
      </button>
      <button class="btn btn--primary inline-flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
        <span>{t('pages.styleguide.buttons.add')}</span>
      </button>
      <button class="btn btn--secondary inline-flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
        <span>{t('pages.styleguide.buttons.delete')}</span>
      </button>
      <a class="btn btn--link inline-flex items-center gap-2" href="#/development/styleguide/buttons">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16"/></svg>
        <span>{t('pages.styleguide.buttons.more')}</span>
      </a>
    </div>
  </div>
</section>


