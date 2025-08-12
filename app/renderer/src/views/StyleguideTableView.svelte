<script lang="ts">
  import Table from '@components/Table.svelte';
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy } from 'svelte';

  type DemoRow = { id: number; name: string | null; age: number | null };

  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());

  const baseRows: DemoRow[] = [
    { id: 1, name: 'Alice', age: 30 },
    { id: 2, name: 'Bob', age: 25 },
    { id: 3, name: 'Charlie', age: 28 },
    { id: 4, name: 'Diana', age: 34 },
  ];

  let filters: Record<string, string> = {};
  let editingRowIds: Set<number> = new Set();
  let rows: DemoRow[] = baseRows.slice();

  function applyFilters(): void {
    const name = (filters['name'] ?? '').toLowerCase();
    const age = filters['age'] ?? '';
    rows = baseRows.filter((r) =>
      (name === '' || (r.name ?? '').toLowerCase().includes(name)) &&
      (age === '' || String(r.age ?? '').includes(age))
    );
  }

  let columns: Array<{ id: keyof DemoRow & string; title: string; editable?: boolean; width?: string; placeholder?: string }> = [];
  $: columns = [
    { id: 'id', title: 'ID', width: '80px' },
    { id: 'name', title: t('pages.styleguide.table.name'), editable: true },
    { id: 'age', title: t('pages.styleguide.table.age'), editable: true },
  ];

  function onFilterChange(e: CustomEvent<{ columnId: string; value: string }>): void {
    filters = { ...filters, [e.detail.columnId]: e.detail.value };
    applyFilters();
  }

  function onEditCell(e: CustomEvent<{ rowId: number; columnId: string; value: string }>): void {
    const { rowId, columnId, value } = e.detail;
    const idx = baseRows.findIndex((r) => r.id === rowId);
    if (idx >= 0) {
      if (columnId === 'name') {
        baseRows[idx].name = value;
      } else if (columnId === 'age') {
        const parsed = Number(value);
        baseRows[idx].age = Number.isFinite(parsed) ? parsed : null;
      }
      applyFilters();
    }
  }

  function onToggleEdit(e: CustomEvent<{ rowId: number }>): void {
    const id = e.detail.rowId;
    if (editingRowIds.has(id)) {
      editingRowIds.delete(id);
      editingRowIds = new Set(editingRowIds);
    } else {
      editingRowIds.add(id);
      editingRowIds = new Set(editingRowIds);
    }
  }

  function onDeleteRow(e: CustomEvent<{ rowId: number }>): void {
    const id = e.detail.rowId;
    const idx = baseRows.findIndex((r) => r.id === id);
    if (idx >= 0) {
      baseRows.splice(idx, 1);
      applyFilters();
    }
  }
</script>

<section class="stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.styleguide.table.title')}</h2>
  <p class="text-sm opacity-80">{t('pages.styleguide.table.desc')}</p>

  <Table
    {rows}
    {filters}
    {editingRowIds}
    on:filterChange={onFilterChange}
    on:editCell={onEditCell}
    on:toggleEdit={onToggleEdit}
    on:deleteRow={onDeleteRow}
    filterPlaceholder={t('components.table.filter')}
    labels={{ edit: t('components.table.edit'), done: t('components.table.done'), delete: t('components.table.delete') }}
    {columns}
  />
</section>


