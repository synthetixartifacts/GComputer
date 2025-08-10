<script lang="ts">
  import BrowseView from '@views/BrowseView.svelte';
  import { openModal } from '@features/ui/service';
  import { t as tStore } from '@ts/i18n/store';
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  import { onDestroy } from 'svelte';
  onDestroy(() => unsubT());
</script>

<section class="stack-md">
  <h1 class="text-3xl font-bold">{t('pages.home.hello')}</h1>
  <p>{t('pages.home.configured')}</p>
  <div class="flex gap-2">
    <button class="btn btn--primary" on:click={openModal}>{t('app.actions.openModal')}</button>
  </div>
  <BrowseView />
</section>


