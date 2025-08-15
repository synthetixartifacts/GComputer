<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy } from 'svelte';
  import FileList from '@components/FileList.svelte';
  import { setPickedFiles, rootFolderName as rootNameStore, rootFolderPath as rootPathStore, uiItems, isRecursive as isRecursiveStore, setRecursive, unloadPickedFiles } from '@features/files-access/store';
  import type { UiFileItem } from '@features/files-access/types';
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());

  let selectedCount: number = 0;
  let rootFolderName: string | null = null;
  let rootFolderPath: string | null = null;
  let filesForUi: UiFileItem[] = [];
  let isRecursive: boolean = false;

  // Shared component handles filters/columns/view toggle

  function onFolderChange(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const filesArray: File[] = input.files ? Array.from(input.files) : [];
    setPickedFiles(filesArray);
  }

  const unsubRoot = rootNameStore.subscribe((v) => (rootFolderName = v));
  const unsubRootPath = rootPathStore.subscribe((v) => (rootFolderPath = v));
  const unsubUi = uiItems.subscribe((v) => {
    filesForUi = v;
    selectedCount = v.length;
  });
  const unsubRecursive = isRecursiveStore.subscribe((v) => (isRecursive = v));
  onDestroy(() => {
    unsubRoot();
    unsubRootPath();
    unsubUi();
    unsubRecursive();
  });
</script>

<section class="container-page stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.features.localFiles.title')}</h2>
  <p class="opacity-80">{t('pages.features.localFiles.desc')}</p>

  <div class="stack-md">
    {#if rootFolderPath}
      <h2 class="text-xl font-semibold break-words" title={rootFolderPath}>{rootFolderPath}</h2>
    {/if}
    <div class="flex items-center gap-3">
      <input id="folder-input" type="file" webkitdirectory multiple class="sr-only" on:change={onFolderChange} aria-label={t('pages.features.localFiles.chooseAria')} />
      <label for="folder-input" class="btn btn--primary w-max">{t('app.actions.browse')}</label>
      <label class="inline-flex items-center gap-2">
        <input type="checkbox" checked={isRecursive} on:change={(e) => setRecursive((e.currentTarget as HTMLInputElement).checked)} />
        <span class="text-sm">{t('pages.features.localFiles.recursive')}</span>
      </label>
    </div>

    {#if selectedCount > 0}
      <div class="opacity-80 flex items-center gap-3">
        <div>
          <span class="font-medium">{t('pages.features.localFiles.folder')}:</span>
          {t('pages.features.localFiles.summary', { count: selectedCount, folder: rootFolderName || t('pages.features.localFiles.folder') })}
        </div>
        <button class="btn btn--secondary btn--sm ml-auto" on:click={unloadPickedFiles}>{t('pages.features.localFiles.unload')}</button>
      </div>
      <FileList files={filesForUi} showLocation={true} />
    {:else}
      <div class="opacity-60">{t('pages.features.localFiles.empty')}</div>
    {/if}
  </div>
</section>



