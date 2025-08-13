<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy, onMount } from 'svelte';
  import FileList from '@components/FileList.svelte';
  import { uiItems, rootFolderPath as rootPathStore, rootFolderName as rootNameStore, isRecursive as isRecursiveStore, setRecursive, unloadPickedFiles, loadFolderByPath } from '@features/files-access/store';
  import type { UiFileItem } from '@features/files-access/types';

  // Make default path easy to change
  const DEFAULT_FOLDER_PATH = '/Users/tommythierry/Downloads/3d';

  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));

  let filesForUi: UiFileItem[] = [];
  let selectedCount: number = 0;
  let rootFolderName: string | null = null;
  let rootFolderPath: string | null = null;
  let isRecursive: boolean = false;

  const unsubUi = uiItems.subscribe((v) => { filesForUi = v; selectedCount = v.length; });
  const unsubRoot = rootNameStore.subscribe((v) => (rootFolderName = v));
  const unsubRootPath = rootPathStore.subscribe((v) => (rootFolderPath = v));
  const unsubRecursive = isRecursiveStore.subscribe((v) => (isRecursive = v));

  let loading: boolean = false;
  let errorMsg: string = '';

  async function refreshFolder(): Promise<void> {
    loading = true;
    errorMsg = '';
    setRecursive(true);
    try {
      if (!window.gc || !window.gc.fs || typeof window.gc.fs.listDirectory !== 'function') {
        errorMsg = 'Filesystem bridge unavailable. Please restart the app (preload update).';
        return;
      }
      await loadFolderByPath(DEFAULT_FOLDER_PATH);
    } catch (err) {
      errorMsg = 'Failed to load folder';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    // Auto-load default path on mount and always force recursive mode
    void refreshFolder();
  });

  onDestroy(() => {
    unsubT();
    unsubUi();
    unsubRoot();
    unsubRootPath();
    unsubRecursive();
  });

  // FileList handles table/grid configuration
</script>

<section class="container-page stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.features.savedLocalFolder.title')}</h2>
  <p class="opacity-80">{t('pages.features.savedLocalFolder.desc')}</p>

  <div class="stack-md">
    <h2 class="text-xl font-semibold break-words" title={rootFolderPath ?? DEFAULT_FOLDER_PATH}>{rootFolderPath ?? DEFAULT_FOLDER_PATH}</h2>
    <div class="flex items-center gap-3">
      <span class="text-sm opacity-70">{t('pages.features.localFiles.recursive')} — ON</span>
      <button class="btn btn--secondary btn--sm ml-auto" on:click={refreshFolder}>Reload</button>
      {#if selectedCount > 0}
        <button class="btn btn--secondary btn--sm" on:click={unloadPickedFiles}>{t('pages.features.localFiles.unload')}</button>
      {/if}
    </div>

    {#if loading}
      <div class="opacity-60">Loading…</div>
    {:else if selectedCount > 0}
      <FileList files={filesForUi} showLocation={true} />
    {:else}
      <div class="opacity-60">{errorMsg || t('pages.features.localFiles.empty')}</div>
    {/if}
  </div>
</section>


