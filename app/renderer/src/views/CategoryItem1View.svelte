<script lang="ts">
  import { t as tStore } from '@features/i18n/store';
  $: t = $tStore;
</script>

<section class="container-page stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.category.item1.title')}</h2>
  <p>{t('pages.category.item1.content')}</p>
</section>


