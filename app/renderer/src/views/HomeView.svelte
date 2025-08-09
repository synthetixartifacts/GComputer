<script lang="ts">
  import BrowseView from '@views/BrowseView.svelte';
  import { openModal } from '@features/ui/service';
  import { t as tStore } from '@features/i18n/store';
  $: t = $tStore;
</script>

<section class="stack-md">
  <h1 class="text-3xl font-bold">{t('pages.home.hello')}</h1>
  <p>{t('pages.home.configured')}</p>
  <div class="flex gap-2">
    <button class="btn btn--primary" on:click={openModal}>{t('app.actions.openModal')}</button>
  </div>
  <BrowseView />
</section>


