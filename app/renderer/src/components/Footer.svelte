<script lang="ts">
  const year = new Date().getFullYear();
  import { t as tStore } from '@features/i18n/store';
  $: t = $tStore;
</script>

<footer class="gc-footer">
  {t('app.footer', { year })}
</footer>