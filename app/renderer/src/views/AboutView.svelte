<script lang="ts">
  import { t as tStore } from '@features/i18n/store';
  $: t = $tStore;
</script>

<section class="container-page stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.about.title')}</h2>
  <div class="prose max-w-none">
    <p>{t('pages.about.desc1')}</p>
    <p>{t('pages.about.desc2')}</p>
  </div>
  
</section>


