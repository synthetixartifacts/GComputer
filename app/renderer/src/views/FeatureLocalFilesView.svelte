<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy } from 'svelte';
  import ViewToggle from '@components/ViewToggle.svelte';
  import FileListComponent from '@components/FileList.svelte';
  import FileGrid from '@components/FileGrid.svelte';
  import Table from '@components/Table.svelte';
  import { setPickedFiles, rootFolderName as rootNameStore, uiItems, pickedItems } from '@features/files-access/store';
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());

  let selectedCount: number = 0;
  let rootFolderName: string | null = null;
  let viewMode: 'list' | 'grid' = 'list';
  let filesForUi: { id: string; name: string; size: string; type: 'file' | 'folder'; date: string }[] = [];
  let rawItems: Array<{ id: string; name: string; relativePath: string | null; sizeBytes: number; lastModified: number; mimeType: string }> = [];

  // Table state (list view)
  let tableRows: Array<{ id: number; name: string; sizeDisplay: string; sizeBytes: number; type: string; dateDisplay: string; lastModified: number }> = [];
  let filteredRows: typeof tableRows = [];
  let filters: Record<string, string> = {};
  let editingRowIds: Set<number> = new Set();
  $: tableRows = filesForUi.map((f, idx) => ({
    id: idx + 1,
    name: f.name,
    sizeDisplay: f.size,
    sizeBytes: rawItems[idx]?.sizeBytes ?? 0,
    type: f.type,
    dateDisplay: f.date,
    lastModified: rawItems[idx]?.lastModified ?? 0,
  }));

  function applyFileFilters(rows: typeof tableRows, f: Record<string, string>): typeof tableRows {
    let out = rows;
    const nameQuery = (f['name'] ?? '').toLowerCase();
    if (nameQuery) {
      out = out.filter((r) => r.name.toLowerCase().includes(nameQuery));
    }
    const typeQuery = (f['type'] ?? '').toLowerCase();
    if (typeQuery) {
      out = out.filter((r) => r.type.toLowerCase().includes(typeQuery));
    }
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
    id: keyof typeof tableRows[number] & string;
    title: string;
    width?: string;
    sortable?: boolean;
    filterable?: boolean;
    filterType?: 'text' | 'number' | 'date' | 'select';
    sortAccessor?: (row: typeof tableRows[number]) => string | number | null | undefined;
    filterOptions?: Array<{ label: string; value: string }>;
  }> = [];
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
    { id: 'type', title: t('pages.styleguide.files.type') },
    { id: 'dateDisplay', title: t('pages.styleguide.files.modified'), sortAccessor: (r) => r.lastModified, filterType: 'date' },
  ];

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
  const unsubPicked = pickedItems.subscribe((v) => {
    rawItems = v as any;
  });
  onDestroy(() => {
    unsubRoot();
    unsubUi();
    unsubPicked();
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
        <FileGrid files={filesForUi as any} />
      {/if}
    {:else}
      <div class="opacity-60">{t('pages.features.localFiles.empty')}</div>
    {/if}
  </div>
</section>



