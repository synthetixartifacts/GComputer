<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  import { onDestroy } from 'svelte';
  onDestroy(() => unsubT());
</script>

<section class="stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.about.title')}</h2>
  <div class="prose max-w-none">
    <p>{t('pages.about.desc1')}</p>
    <p>{t('pages.about.desc2')}</p>
  </div>
  
</section>


