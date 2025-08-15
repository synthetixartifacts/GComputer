<script lang="ts">
  import NavTree from '@components/NavTree.svelte';
  import Drawer from '@components/Drawer.svelte';
  import { menuItems } from '@features/navigation/store';
  import type { MenuItem } from '@features/navigation/types';
  import { onDestroy } from 'svelte';
  import { t as tStore } from '@ts/i18n/store';

  export let open: boolean = false;
  export let onClose: () => void;
  let items: MenuItem[] = [];
  const unsubscribe = menuItems.subscribe((v) => (items = v));
  onDestroy(() => unsubscribe());
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());
</script>

<Drawer {open} {onClose} title={t('app.menu.menu')}>
  <nav class="grid gap-2">
    <NavTree items={items} onNavigate={onClose} />
  </nav>
</Drawer>
