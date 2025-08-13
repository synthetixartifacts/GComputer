<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy } from 'svelte';
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());
</script>

<section class="container-page stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.features.locationTbd.title')}</h2>
  <p class="opacity-80">{t('pages.features.locationTbd.desc')}</p>
  <div class="demo-box p-4 opacity-80">
    <ul class="list-disc pl-5 grid gap-2">
      <li>Preload IPC: open native directory dialog</li>
      <li>Settings: store bookmarked locations</li>
      <li>Renderer view: read-only preview via whitelisted APIs</li>
    </ul>
  </div>
</section>



