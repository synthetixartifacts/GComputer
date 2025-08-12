<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  import { onDestroy } from 'svelte';
  onDestroy(() => unsubT());
</script>

<section class="container-page stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.styleguide.base.title')}</h2>

  <div class="stack-lg">
    <!-- Text Section -->
    <div class="stack-md">
      <h3 class="text-lg font-semibold">{t('pages.styleguide.base.textSection')}</h3>
      <div class="stack-sm">
        <h1>H1 — {t('pages.styleguide.base.example')}</h1>
        <h2>H2 — {t('pages.styleguide.base.example')}</h2>
        <h3>H3 — {t('pages.styleguide.base.example')}</h3>
        <h4>H4 — {t('pages.styleguide.base.example')}</h4>
        <h5>H5 — {t('pages.styleguide.base.example')}</h5>
        <h6>H6 — {t('pages.styleguide.base.example')}</h6>
        <p>{t('pages.styleguide.base.body')}</p>
        <p><strong>{t('pages.styleguide.base.bold')}</strong> · <em>{t('pages.styleguide.base.italic')}</em></p>
        <ul class="list-disc pl-5">
          <li>{t('pages.styleguide.base.listItemA')}</li>
          <li>{t('pages.styleguide.base.listItemB')}</li>
          <li>{t('pages.styleguide.base.listItemC')}</li>
        </ul>
        <ol class="list-decimal pl-5">
          <li>{t('pages.styleguide.base.listItemA')}</li>
          <li>{t('pages.styleguide.base.listItemB')}</li>
          <li>{t('pages.styleguide.base.listItemC')}</li>
        </ol>
      </div>
    </div>

    <!-- Icon Section -->
    <div class="stack-md">
      <h3 class="text-lg font-semibold">{t('pages.styleguide.base.iconSection')}</h3>
      <div class="flex flex-wrap gap-3 items-center">
        <span class="inline-flex items-center gap-2 px-2 py-1 border rounded">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
          <span>{t('pages.styleguide.base.iconExample')}</span>
        </span>
        <button class="btn btn--primary inline-flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
          <span>{t('pages.styleguide.base.iconInButton')}</span>
        </button>
        <a class="btn btn--link inline-flex items-center gap-2" href="#/test/styleguide/base">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16"/></svg>
          <span>{t('pages.styleguide.base.iconInLink')}</span>
        </a>
      </div>
    </div>
  </div>
</section>



