<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy } from 'svelte';
  import Table from '@components/Table.svelte';
  import FileGrid from '@components/FileGrid.svelte';
  import ViewToggle from '@components/ViewToggle.svelte';
  import type { UiFileItem } from '@features/files-access/types';

  // Input files in UiFileItem shape
  export let files: UiFileItem[] = [];
  // Optional columns and UX controls
  export let showLocation: boolean = false;
  export let showViewToggle: boolean = true;
  export let initialMode: 'list' | 'grid' = 'list';
  export let enableSorting: boolean = true;
  export let emptyMessage: string | null = null;
  export let density: 'regular' | 'compact' = 'regular';

  // i18n
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());

  // Table rows derived from UiFileItem
  type Row = {
    id: number;
    name: string;
    sizeDisplay: string;
    sizeBytes: number;
    type: string;
    dateDisplay: string;
    lastModified: number;
    location?: string;
  };

  let viewMode: 'list' | 'grid' = initialMode;
  let tableRows: Row[] = [];

  function computeType(name: string, raw: 'file' | 'folder'): string {
    if (raw === 'folder') return 'folder';
    const dot = name.lastIndexOf('.');
    if (dot !== -1 && dot < name.length - 1) return name.slice(dot + 1).toLowerCase();
    return 'file';
  }

  $: tableRows = files.map((f, idx) => ({
    id: idx + 1,
    name: f.name,
    sizeDisplay: f.size,
    sizeBytes: f.sizeBytes ?? 0,
    type: computeType(f.name, f.type),
    dateDisplay: f.date,
    lastModified: f.lastModified ?? 0,
    location: f.location,
  })) as Row[];

  type GridFile = { id: number; name: string; size: string; type: 'file' | 'folder'; date: string };
  let gridFiles: GridFile[] = [];
  $: gridFiles = tableRows.map((r) => ({ id: r.id, name: r.name, size: r.sizeDisplay, type: (r.type === 'folder' ? 'folder' : 'file') as 'file' | 'folder', date: r.dateDisplay }));

  // Filters
  let filters: Record<string, string> = {};
  function applyFilters(rows: Row[], f: Record<string, string>): Row[] {
    let out = rows;
    const nameQuery = (f['name'] ?? '').toLowerCase();
    if (nameQuery) out = out.filter((r) => r.name.toLowerCase().includes(nameQuery));
    const typeQuery = (f['type'] ?? '').toLowerCase();
    if (typeQuery) out = out.filter((r) => (r.type ?? '').toLowerCase() === typeQuery);
    if (showLocation) {
      const locationQuery = (f['location'] ?? '').toLowerCase();
      if (locationQuery) out = out.filter((r) => (r.location ?? '').toLowerCase() === locationQuery);
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
      if (match) out = out.filter((r) => match(r.sizeBytes ?? 0));
    }
    const minDate = f['dateDisplay'] ?? '';
    if (minDate) {
      const threshold = new Date(minDate).getTime();
      if (!Number.isNaN(threshold)) out = out.filter((r) => (r.lastModified ?? 0) >= threshold);
    }
    return out;
  }
  $: filteredRows = applyFilters(tableRows, filters);

  // Columns
  let columns: Array<{
    id: keyof Row & string;
    title: string;
    width?: string;
    sortable?: boolean;
    filterable?: boolean;
    filterType?: 'text' | 'number' | 'date' | 'select';
    sortAccessor?: (row: Row) => string | number | null | undefined;
    filterOptions?: Array<{ label: string; value: string }>;
  }> = [];

  $: typeFilterOptions = Array.from(new Set(tableRows.map((r) => r.type).filter((v) => (v ?? '') !== '')))
    .sort((a, b) => a.localeCompare(b))
    .map((v) => ({ label: v, value: v }));

  $: locationFilterOptions = showLocation
    ? Array.from(new Set(tableRows.map((r) => r.location ?? '').filter((v) => v !== '')))
        .sort((a, b) => a.localeCompare(b))
        .map((v) => ({ label: v, value: v }))
    : [];

  $: columns = [
    { id: 'name', title: t('pages.styleguide.files.name') },
    {
      id: 'sizeDisplay',
      title: t('pages.styleguide.files.size'),
      sortAccessor: (r: Row) => r.sizeBytes,
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
    ...(showLocation
      ? ([{ id: 'location', title: t('pages.features.localFiles.location'), filterType: 'select', filterOptions: locationFilterOptions }] as Array<any>)
      : []),
    { id: 'dateDisplay', title: t('pages.styleguide.files.modified'), sortAccessor: (r: Row) => r.lastModified, filterType: 'date' },
  ];

  // Labels for inner Table
  $: tableLabels = {
    edit: t('components.table.edit'),
    done: t('components.table.done'),
    delete: t('components.table.delete'),
    clearFilters: t('components.table.clearFilters'),
    clearFilter: t('components.table.clearFilter'),
  };

  $: resolvedEmptyMessage = emptyMessage ?? t('pages.styleguide.table.empty');
</script>

<div class="stack-md">
  {#if showViewToggle}
    <div class="flex items-center gap-3">
      <ViewToggle
        mode={viewMode}
        labels={{ list: t('pages.styleguide.files.listView'), grid: t('pages.styleguide.files.gridView') }}
        on:change={(e) => (viewMode = e.detail.mode)}
      />
    </div>
  {/if}

  {#if viewMode === 'list'}
    <Table
      rows={filteredRows}
      {filters}
      editingRowIds={new Set()}
      filterPlaceholder={t('components.table.filter')}
      labels={tableLabels}
      emptyMessage={resolvedEmptyMessage}
      {enableSorting}
      showActionsColumn={false}
      showDefaultActions={false}
      {columns}
      {density}
      on:filterChange={(e) => {
        if (e.detail.columnId === '__clear_all__') { filters = {}; return; }
        filters = { ...filters, [e.detail.columnId]: e.detail.value };
      }}
    >
      <svelte:fragment slot="header-actions">
        <slot name="header-actions" />
      </svelte:fragment>
    </Table>
  {:else}
    <FileGrid files={gridFiles} />
  {/if}
</div>


