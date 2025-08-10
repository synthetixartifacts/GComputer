<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  import { onDestroy } from 'svelte';
  onDestroy(() => unsubT());
</script>

<section class="container-page stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.category.item2.title')}</h2>
  <p>{t('pages.category.item2.content')}</p>
</section>


