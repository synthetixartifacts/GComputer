<script lang="ts">
  import Table from '@components/Table.svelte';
  import { onDestroy, onMount } from 'svelte';
  import { testRows, testFilters, editingRowIds, pendingEdits, refreshTestRows, setFilter, toggleEdit, stageEdit, saveAllEdits, addRow, removeRow, truncateTable, saveEditsForRow } from '@features/db/store';
  import type { TestRow } from '@features/db/types';
  import { t as tStore } from '@ts/i18n/store';

  let rows: TestRow[] = [];
  let filters: { column1?: string; column2?: string } = {};
  let editing: Set<number> = new Set();

  const unsubRows = testRows.subscribe((v) => (rows = v));
  const unsubFilters = testFilters.subscribe((v) => (filters = v));
  const unsubEditing = editingRowIds.subscribe((v) => (editing = v));

  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));

  let newC1 = '';
  let newC2 = '';

  onMount(() => {
    refreshTestRows();
  });
  onDestroy(() => {
    unsubRows();
    unsubFilters();
    unsubEditing();
    unsubT();
  });

  let columns: Array<{ id: string; title: string; editable?: boolean; width?: string }> = [];
  $: columns = [
    { id: 'id', title: 'ID', width: '80px' },
    { id: 'column1', title: t('pages.db.testTable.column1'), editable: true },
    { id: 'column2', title: t('pages.db.testTable.column2'), editable: true },
  ];

  function onFilterChange(e: CustomEvent<{ columnId: string; value: string }>) {
    const { columnId, value } = e.detail;
    setFilter(columnId as any, value);
    refreshTestRows();
  }

  function onEditCell(e: CustomEvent<{ rowId: number; columnId: string; value: string }>) {
    const { rowId, columnId, value } = e.detail;
    stageEdit(rowId, columnId as 'column1' | 'column2', value);
  }

  async function onToggleEdit(e: CustomEvent<{ rowId: number }>) {
    const id = e.detail.rowId;
    if (editing.has(id)) {
      await saveEditsForRow(id);
    } else {
      toggleEdit(id);
    }
  }

  async function onDelete(e: CustomEvent<{ rowId: number }>) {
    await removeRow(e.detail.rowId);
  }
</script>

<section class="stack-lg">
  <div class="flex items-center justify-between">
    <h2 class="text-2xl font-bold">{t('pages.db.testTable.title')}</h2>
    <div class="flex gap-2">
      <button class="btn btn--secondary" on:click={() => truncateTable()}>{t('pages.db.testTable.truncate')}</button>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
    <label class="field">
      <span class="field__label">{t('pages.db.testTable.column1')}</span>
      <input class="input" bind:value={newC1} />
    </label>
    <label class="field">
      <span class="field__label">{t('pages.db.testTable.column2')}</span>
      <input class="input" bind:value={newC2} />
    </label>
    <div class="flex items-end">
      <button class="btn btn--primary" on:click={() => { addRow({ column1: newC1, column2: newC2 }); newC1=''; newC2=''; }}>{t('pages.db.testTable.add')}</button>
    </div>
  </div>

  <Table
    {rows}
    editingRowIds={editing}
    {filters}
    on:filterChange={onFilterChange}
    on:editCell={onEditCell}
    on:toggleEdit={onToggleEdit}
    on:deleteRow={onDelete}
    columns={columns}
  />

  <div class="flex justify-end">
    <button class="btn btn--primary" on:click={() => saveAllEdits()}>{t('pages.db.testTable.save')}</button>
  </div>
</section>


