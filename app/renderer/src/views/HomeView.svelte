<script lang="ts">
  import BrowseView from '@views-browse/BrowseView.svelte';
  import { openModal } from '@features/ui/service';
  import { setPageTitle, clearPageTitle } from '@ts/shared/utils/page-utils';
  import { t as tStore } from '@ts/i18n/store';
  import { onMount, onDestroy } from 'svelte';
  
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  
  onMount(() => {
    setPageTitle('pages.home.title');
  });
  
  onDestroy(() => {
    clearPageTitle();
    unsubT();
  });
</script>

<section class="stack-md">
  <p>{t('pages.home.configured')}</p>
  <div class="flex gap-2">
    <button class="btn btn--primary" on:click={openModal}>{t('app.actions.openModal')}</button>
  </div>
  <BrowseView />
</section>


