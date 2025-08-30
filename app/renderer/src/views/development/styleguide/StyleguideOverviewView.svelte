<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy } from 'svelte';
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());
</script>

<section class="stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.styleguide.title')}</h2>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <a class="btn btn--secondary" href="#/development/styleguide/base">{t('app.menu.styleguide.base')}</a>
    <a class="btn btn--secondary" href="#/development/styleguide/inputs">{t('app.menu.styleguide.inputs')}</a>
    <a class="btn btn--secondary" href="#/development/styleguide/buttons">{t('app.menu.styleguide.buttons')}</a>
    <a class="btn btn--secondary" href="#/development/styleguide/table">{t('app.menu.styleguide.table')}</a>
    <a class="btn btn--secondary" href="#/development/styleguide/components">{t('app.menu.styleguide.components')}</a>
    <a class="btn btn--secondary" href="#/development/styleguide/search">{t('app.menu.styleguide.search')}</a>
  </div>
</section>


