<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy } from 'svelte';
  import ViewToggle from '@components/ViewToggle.svelte';
  import FileListComponent from '@components/FileList.svelte';
  import FileGrid from '@components/FileGrid.svelte';
  import { setPickedFiles, rootFolderName as rootNameStore, uiItems } from '@features/files-access/store';
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());

  let selectedCount: number = 0;
  let rootFolderName: string | null = null;
  let viewMode: 'list' | 'grid' = 'list';
  let filesForUi: { id: string; name: string; size: string; type: 'file' | 'folder'; date: string }[] = [];

  function onFolderChange(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const filesArray: File[] = input.files ? Array.from(input.files) : [];
    setPickedFiles(filesArray);
  }

  const unsubRoot = rootNameStore.subscribe((v) => (rootFolderName = v));
  const unsubUi = uiItems.subscribe((v) => {
    filesForUi = v;
    selectedCount = v.length;
  });
  onDestroy(() => {
    unsubRoot();
    unsubUi();
  });
</script>

<section class="container-page stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.features.localFiles.title')}</h2>
  <p class="opacity-80">{t('pages.features.localFiles.desc')}</p>

  <div class="stack-md">
    <input id="folder-input" type="file" webkitdirectory multiple class="sr-only" on:change={onFolderChange} aria-label={t('pages.features.localFiles.chooseAria')} />
    <label for="folder-input" class="btn btn--primary w-max">{t('app.actions.browse')}</label>

    {#if selectedCount > 0}
      <div class="opacity-80">
        <span class="font-medium">{t('pages.features.localFiles.folder')}:</span>
        {t('pages.features.localFiles.summary', { count: selectedCount, folder: rootFolderName || t('pages.features.localFiles.folder') })}
      </div>
      <ViewToggle mode={viewMode} on:change={(e) => (viewMode = e.detail.mode)} />
      {#if viewMode === 'list'}
        <FileListComponent files={filesForUi as any} />
      {:else}
        <FileGrid files={filesForUi as any} />
      {/if}
    {:else}
      <div class="opacity-60">{t('pages.features.localFiles.empty')}</div>
    {/if}
  </div>
</section>



