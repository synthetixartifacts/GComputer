<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy } from 'svelte';
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());
</script>

<section class="container-page stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.features.title')}</h2>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <a class="btn btn--secondary" href="#/development/features/local-files">{t('app.menu.features.localFiles')}</a>
    <a class="btn btn--secondary" href="#/development/features/saved-local-folder">{t('app.menu.features.savedLocalFolder')}</a>
  </div>
</section>



