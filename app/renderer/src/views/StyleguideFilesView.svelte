<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy } from 'svelte';
  import ViewToggle from '@components/ViewToggle.svelte';
  import FileGrid from '@components/FileGrid.svelte';
  import Table from '@components/Table.svelte';
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());

  // Demo dataset with raw + display fields for table sorting and filtering
  type FileRow = { id: number; name: string; sizeDisplay: string; sizeBytes: number; type: 'file'|'folder'; dateDisplay: string; lastModified: number };
  function parseSizeDisplayToBytes(s: string): number {
    const m = s.trim().match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
    if (!m) return 0;
    const n = parseFloat(m[1]);
    const unit = m[2].toUpperCase();
    const k = 1024;
    if (unit === 'B') return n;
    if (unit === 'KB') return n * k;
    if (unit === 'MB') return n * k * k;
    if (unit === 'GB') return n * k * k * k;
    return 0;
  }
  const tableRows: FileRow[] = [
    { id: 1, name: 'Documents', sizeDisplay: '-', sizeBytes: 0, type: 'folder', dateDisplay: '2025-08-01', lastModified: new Date('2025-08-01').getTime() },
    { id: 2, name: 'report.pdf', sizeDisplay: '1.2 MB', sizeBytes: parseSizeDisplayToBytes('1.2 MB'), type: 'file', dateDisplay: '2025-07-10', lastModified: new Date('2025-07-10').getTime() },
    { id: 3, name: 'photo.jpg', sizeDisplay: '2.1 MB', sizeBytes: parseSizeDisplayToBytes('2.1 MB'), type: 'file', dateDisplay: '2025-05-22', lastModified: new Date('2025-05-22').getTime() },
    { id: 4, name: 'notes.txt', sizeDisplay: '4 KB', sizeBytes: parseSizeDisplayToBytes('4 KB'), type: 'file', dateDisplay: '2025-04-15', lastModified: new Date('2025-04-15').getTime() }
  ];

  // Columns for the Table component
  let columns: Array<{
    id: keyof FileRow & string;
    title: string;
    width?: string;
    sortable?: boolean;
    filterable?: boolean;
    filterType?: 'text' | 'number' | 'date' | 'select';
    filterOptions?: Array<{ label: string; value: string }>;
    sortAccessor?: (row: FileRow) => string | number | null | undefined;
  }> = [];
  $: columns = [
    { id: 'name', title: t('pages.styleguide.files.name') },
    { id: 'sizeDisplay', title: t('pages.styleguide.files.size'), sortAccessor: (r) => r.sizeBytes, filterType: 'select', filterOptions: [
      { label: '< 1 MB', value: 'lt1m' },
      { label: '1 – 50 MB', value: '1to50m' },
      { label: '50 – 500 MB', value: '50to500m' },
      { label: '500 MB – 1 GB', value: '500mto1g' },
      { label: '> 1 GB', value: 'gt1g' },
    ] },
    { id: 'type', title: t('pages.styleguide.files.type') },
    { id: 'dateDisplay', title: t('pages.styleguide.files.modified'), sortAccessor: (r) => r.lastModified, filterType: 'date' },
  ];

  // Filters and application
  let filters: Record<string, string> = {};
  function applyFilters(rows: FileRow[], f: Record<string, string>): FileRow[] {
    let out = rows;
    const nameQuery = (f['name'] ?? '').toLowerCase();
    if (nameQuery) out = out.filter((r) => r.name.toLowerCase().includes(nameQuery));
    const typeQuery = (f['type'] ?? '').toLowerCase();
    if (typeQuery) out = out.filter((r) => r.type.toLowerCase().includes(typeQuery));
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
  let displayedRows: FileRow[] = [];
  $: displayedRows = applyFilters(tableRows, filters);
  let viewMode: 'list'|'grid' = 'list';
</script>

<section class="container-page stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.styleguide.files.title')}</h2>
  <p class="opacity-80">{t('pages.styleguide.files.desc')}</p>

  <ViewToggle mode={viewMode} on:change={(e) => (viewMode = e.detail.mode)} />

  {#if viewMode === 'list'}
    <Table
      rows={displayedRows}
      {filters}
      editingRowIds={new Set()}
      filterPlaceholder={t('components.table.filter')}
      labels={{ edit: t('components.table.edit'), done: t('components.table.done'), delete: t('components.table.delete'), clearFilters: t('components.table.clearFilters'), clearFilter: t('components.table.clearFilter') }}
      emptyMessage={t('pages.styleguide.table.empty')}
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
    <FileGrid files={tableRows.map((r) => ({ id: r.id, name: r.name, size: r.sizeDisplay, type: r.type, date: r.dateDisplay })) as any} />
  {/if}
</section>


