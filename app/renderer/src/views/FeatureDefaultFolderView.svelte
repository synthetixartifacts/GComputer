<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy, onMount } from 'svelte';
  import Table from '@components/Table.svelte';
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

  // Table state (reuse logic from FeatureLocalFilesView)
  type TR = { id: number; name: string; sizeDisplay: string; sizeBytes: number; type: string; dateDisplay: string; lastModified: number; location: string };
  let tableRows: TR[] = [];
  let filteredRows: TR[] = [];
  let filters: Record<string, string> = {};
  let editingRowIds: Set<number> = new Set();
  function getFileTypeDisplay(name: string, isFolder: boolean): string {
    if (isFolder) return 'folder';
    const dotIndex = name.lastIndexOf('.');
    if (dotIndex !== -1 && dotIndex < name.length - 1) {
      return name.slice(dotIndex + 1).toLowerCase();
    }
    return 'file';
  }
  $: tableRows = filesForUi.map((f, idx) => ({
    id: idx + 1,
    name: f.name,
    sizeDisplay: f.size,
    sizeBytes: f.sizeBytes ?? 0,
    type: getFileTypeDisplay(f.name, f.type === 'folder'),
    dateDisplay: f.date,
    lastModified: f.lastModified ?? 0,
    location: f.location,
  }));

  function applyFileFilters(rows: TR[], f: Record<string, string>): TR[] {
    let out = rows;
    const nameQuery = (f['name'] ?? '').toLowerCase();
    if (nameQuery) { out = out.filter((r) => r.name.toLowerCase().includes(nameQuery)); }
    const typeQuery = (f['type'] ?? '').toLowerCase();
    if (typeQuery) { out = out.filter((r) => r.type.toLowerCase() === typeQuery); }
    const locationQuery = (f['location'] ?? '').toLowerCase();
    if (locationQuery) { out = out.filter((r) => r.location.toLowerCase() === locationQuery); }
    const sizeBand = f['sizeDisplay'] ?? '';
    if (sizeBand) {
      const MB = 1024 * 1024;
      const bands: Record<string, (n: number) => boolean> = {
        lt1m: (n) => n < 1 * MB,
        '1to50m': (n) => n >= 1 * MB && n < 50 * MB,
        '50to500m': (n) => n >= 50 * MB && n < 500 * MB,
        '500mto1g': (n) => n >= 500 * MB && n < 1024 * MB,
        gt1g: (n) => n >= 1024 * MB,
      };
      const match = bands[sizeBand];
      if (match) out = out.filter((r) => match(r.sizeBytes));
    }
    const minDate = f['dateDisplay'] ?? '';
    if (minDate) {
      const threshold = new Date(minDate).getTime();
      if (!Number.isNaN(threshold)) out = out.filter((r) => r.lastModified >= threshold);
    }
    return out;
  }
  $: filteredRows = applyFileFilters(tableRows, filters);

  let columns: Array<{
    id: keyof TR & string;
    title: string;
    width?: string;
    sortable?: boolean;
    filterable?: boolean;
    filterType?: 'text' | 'number' | 'date' | 'select';
    sortAccessor?: (row: TR) => string | number | null | undefined;
    filterOptions?: Array<{ label: string; value: string }>;
  }> = [];
  $: typeFilterOptions = Array.from(new Set(tableRows.map((r) => r.type).filter((v) => (v ?? '') !== '')))
    .sort((a, b) => a.localeCompare(b))
    .map((v) => ({ label: v, value: v }));
  $: locationFilterOptions = Array.from(new Set(tableRows.map((r) => r.location).filter((v) => (v ?? '') !== '')))
    .sort((a, b) => a.localeCompare(b))
    .map((v) => ({ label: v, value: v }));
  $: columns = [
    { id: 'name', title: t('pages.styleguide.files.name') },
    {
      id: 'sizeDisplay',
      title: t('pages.styleguide.files.size'),
      sortAccessor: (r) => r.sizeBytes,
      filterType: 'select',
      filterOptions: [
        { label: '< 1 MB', value: 'lt1m' },
        { label: '1 – 50 MB', value: '1to50m' },
        { label: '50 – 500 MB', value: '50to500m' },
        { label: '500 MB – 1 GB', value: '500mto1g' },
        { label: '> 1 GB', value: 'gt1g' },
      ],
    },
    { id: 'type', title: t('pages.styleguide.files.type'), filterType: 'select', filterOptions: typeFilterOptions },
    { id: 'location', title: t('pages.features.localFiles.location'), filterType: 'select', filterOptions: locationFilterOptions },
    { id: 'dateDisplay', title: t('pages.styleguide.files.modified'), sortAccessor: (r) => r.lastModified, filterType: 'date' },
  ];
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
      <Table
        rows={filteredRows}
        {filters}
        {editingRowIds}
        filterPlaceholder={t('components.table.filter')}
        labels={{ edit: t('components.table.edit'), done: t('components.table.done'), delete: t('components.table.delete'), clearFilters: t('components.table.clearFilters'), clearFilter: t('components.table.clearFilter') }}
        emptyMessage={t('pages.features.localFiles.empty')}
        enableSorting={true}
        showActionsColumn={false}
        showDefaultActions={false}
        {columns}
        on:filterChange={(e) => {
          if (e.detail.columnId === '__clear_all__') { filters = {}; return; }
          filters = { ...filters, [e.detail.columnId]: e.detail.value };
        }}
      />
    {:else}
      <div class="opacity-60">{errorMsg || t('pages.features.localFiles.empty')}</div>
    {/if}
  </div>
</section>


