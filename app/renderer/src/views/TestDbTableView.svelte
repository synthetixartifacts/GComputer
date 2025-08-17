<script lang="ts">
  import AdminCrud from '@components/admin/AdminCrud.svelte';
  import TestFormModal from '@components/admin/TestFormModal.svelte';
  import { onDestroy, onMount } from 'svelte';
  import { testRows, testFilters, refreshTestRows, setFilter, addRow, removeRow, truncateTable, saveEditsForRow } from '@features/db/store';
  import type { TestRow, TestTableConfig } from '@features/db/types';
  import { t as tStore } from '@ts/i18n/store';

  let rows: TestRow[] = [];
  let filters: { column1?: string; column2?: string } = {};

  const unsubRows = testRows.subscribe((v) => (rows = v));
  const unsubFilters = testFilters.subscribe((v) => (filters = v));

  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));

  // Modal state
  let modalOpen = false;
  let modalMode: 'create' | 'edit' | 'view' = 'create';
  let currentRow: Partial<TestRow> = {};
  let loading = false;

  onMount(() => {
    refreshTestRows();
  });
  onDestroy(() => {
    unsubRows();
    unsubFilters();
    unsubT();
  });

  // Field configuration for test table
  $: fields = [
    {
      id: 'id',
      title: 'ID',
      type: 'number',
      width: '80px',
      showInTable: true,
      showInForm: false,
      readonly: true
    },
    {
      id: 'column1',
      title: t('pages.db.testTable.column1'),
      type: 'text',
      showInTable: true,
      showInForm: true,
      validation: { required: true },
      placeholder: 'Enter value for column 1'
    },
    {
      id: 'column2',
      title: t('pages.db.testTable.column2'),
      type: 'text',
      showInTable: true,
      showInForm: true,
      placeholder: 'Enter value for column 2'
    }
  ];

  $: config = {
    fields,
    entityName: 'Test Rows',
    singularName: 'Test Row'
  };

  function handleFilterChange(event: CustomEvent<{ columnId: string; value: string }>) {
    const { columnId, value } = event.detail;
    setFilter(columnId as any, value);
    refreshTestRows();
  }

  function handleCreateNew() {
    currentRow = {};
    modalMode = 'create';
    modalOpen = true;
  }

  function handleEditRow(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    const row = rows.find(r => r.id === rowId);
    if (row) {
      currentRow = { ...row };
      modalMode = 'edit';
      modalOpen = true;
    }
  }

  function handleViewRow(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    const row = rows.find(r => r.id === rowId);
    if (row) {
      currentRow = { ...row };
      modalMode = 'view';
      modalOpen = true;
    }
  }

  function handleDuplicate(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    const row = rows.find(r => r.id === rowId);
    if (row) {
      currentRow = {
        column1: row.column1,
        column2: row.column2
      };
      modalMode = 'create';
      modalOpen = true;
    }
  }

  async function handleDeleteRow(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    await removeRow(rowId);
  }

  async function handleModalSubmit(event: CustomEvent<{ data: Partial<TestRow>; mode: 'create' | 'edit' | 'view' }>) {
    const { data, mode } = event.detail;
    loading = true;
    
    try {
      if (mode === 'create') {
        await addRow({ column1: data.column1 || null, column2: data.column2 || null });
        modalOpen = false;
      } else if (mode === 'edit') {
        // For edit mode, we need to save the changes using the existing store method
        // This is a simplified approach - in a real app you'd have a proper update method
        await saveEditsForRow(currentRow.id!);
        modalOpen = false;
      }
    } catch (error) {
      console.error(`Failed to ${mode} test row:`, error);
    } finally {
      loading = false;
    }
  }

  function handleModalClose() {
    modalOpen = false;
    currentRow = {};
  }

  async function handleTruncate() {
    if (confirm('Are you sure you want to delete all test data?')) {
      await truncateTable();
    }
  }
</script>

<section class="stack-lg">
  <div class="flex items-center justify-between">
    <h2 class="text-2xl font-bold">{t('pages.db.testTable.title')}</h2>
    <div class="flex gap-2">
      <button class="btn btn--danger" on:click={handleTruncate}>{t('pages.db.testTable.truncate')}</button>
    </div>
  </div>

  <AdminCrud
    title={t('pages.db.testTable.title')}
    description="Test table for database operations"
    data={rows}
    {config}
    {filters}
    {loading}
    createButtonLabel={t('pages.db.testTable.add')}
    on:filterChange={handleFilterChange}
    on:editRow={handleEditRow}
    on:viewRow={handleViewRow}
    on:deleteRow={handleDeleteRow}
    on:createNew={handleCreateNew}
    on:duplicate={handleDuplicate}
  />

  <TestFormModal
    open={modalOpen}
    mode={modalMode}
    data={currentRow}
    {loading}
    on:submit={handleModalSubmit}
    on:close={handleModalClose}
  />
</section>


