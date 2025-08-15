# Table component usage

## Import
```svelte
<script lang="ts">
  import Table from '@components/Table.svelte';
  type Row = { id: number; name: string; age: number };
  let rows: Row[] = [];
  let filters: Record<string, string> = {};
  let editingRowIds: Set<number> = new Set();
  const columns = [
    { id: 'name', title: 'Name', editable: true },
    { id: 'age', title: 'Age', editable: true },
  ] satisfies Array<{ id: keyof Row & string; title: string; editable?: boolean }>;
</script>

<Table
  {rows}
  {filters}
  {editingRowIds}
  on:filterChange={(e) => (filters = { ...filters, [e.detail.columnId]: e.detail.value })}
  on:editCell={(e) => {/* update your model */}}
  on:toggleEdit={(e) => {/* toggle row id */}}
  on:deleteRow={(e) => {/* delete row */}}
  filterPlaceholder="Filter"
  labels={{ edit: 'Edit', done: 'Done', delete: 'Delete', clearFilters: 'Clear filters', clearFilter: 'Clear' }}
  columns={columns}
/>
```

## Props
- columns: Array of column defs with `id`, `title`, optional `editable`, `width`, `placeholder`, `filterType`, `filterOptions`, `sortAccessor`.
- rows: array of row objects; each must include numeric `id`.
- filters: controlled `Record<string,string>`.
- editingRowIds: `Set<number>` of row ids in edit mode.
- labels: i18n labels.
- density: 'regular' | 'compact'.
- emptyMessage: text when no rows.
- enableSorting: toggle sorting.
- showActionsColumn / showDefaultActions: toggle action column and built-in actions.

## Filtering
The component renders controls based on `filterType`: 'text' (default), 'number', 'date', or 'select' with `filterOptions`.

## Sorting
Clicking a header cycles asc → desc → off if `enableSorting` and column is sortable.


