<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy } from 'svelte';
  import ViewToggle from '@components/ViewToggle.svelte';
  import FileList from '@components/FileList.svelte';
  import FileGrid from '@components/FileGrid.svelte';
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());

  type FileItem = { id: number; name: string; size: string; type: 'file'|'folder'; date: string };
  const files: FileItem[] = [
    { id: 1, name: 'Documents', size: '-', type: 'folder', date: '2025-08-01' },
    { id: 2, name: 'report.pdf', size: '1.2 MB', type: 'file', date: '2025-07-10' },
    { id: 3, name: 'photo.jpg', size: '2.1 MB', type: 'file', date: '2025-05-22' },
    { id: 4, name: 'notes.txt', size: '4 KB', type: 'file', date: '2025-04-15' }
  ];
  let viewMode: 'list'|'grid' = 'list';
</script>

<section class="container-page stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.styleguide.files.title')}</h2>
  <p class="opacity-80">{t('pages.styleguide.files.desc')}</p>

  <ViewToggle mode={viewMode} on:change={(e) => (viewMode = e.detail.mode)} />

  {#if viewMode === 'list'}
    <FileList {files} />
  {:else}
    <FileGrid {files} />
  {/if}
</section>


