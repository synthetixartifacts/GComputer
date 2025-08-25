<script lang="ts">
  const year = new Date().getFullYear();
  import { t as tStore } from '@ts/i18n/store';
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  import { onDestroy } from 'svelte';
  onDestroy(() => unsubT());
</script>

<footer class="gc-footer">
  <div class="gc-footer__inner">
    {t('app.footer', { year })}
  </div>
</footer>