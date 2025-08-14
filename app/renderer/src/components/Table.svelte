<script lang="ts">
  /**
   * Reusable data table component with filtering, inline editing and action slots.
   *
   * Props:
   * - columns: column definitions including id, title, editability and widths
   * - rows: array of row objects (each requires a numeric `id`)
   * - filters: map of columnId -> filter value (controlled by parent)
   * - editingRowIds: Set of row ids currently in edit mode
   * - filterPlaceholder: placeholder for header filter inputs
   * - showDefaultActions: whether to render the built-in edit/delete actions
   * - labels: i18n strings for actions and inputs
   * - density: 'regular' | 'compact' paddings
   * - emptyMessage: message when there are no rows
   *
   * Slots:
   * - header-actions: toolbar area above the table
   * - actions: per-row custom actions (receives { row })
   *
   * Events:
   * - filterChange: { columnId, value }
   * - editCell: { rowId, columnId, value }
   * - toggleEdit: { rowId }
   * - deleteRow: { rowId }
   */
  import { createEventDispatcher } from 'svelte';

  interface ColumnDef<TRow extends { id: number }> {
    id: keyof TRow & string;
    title: string;
    editable?: boolean;
    width?: string;
    placeholder?: string;
    access?: (row: TRow) => string | number | null | undefined;
    sortable?: boolean; // defaults to true
    filterable?: boolean; // defaults to true
    filterType?: 'text' | 'number' | 'date' | 'select';
    filterOptions?: Array<{ label: string; value: string }>;
    sortAccessor?: (row: TRow) => string | number | null | undefined;
  }

  export let columns: ColumnDef<any>[] = [];
  export let rows: Array<{ id: number; [k: string]: any }> = [];
  export let filters: Record<string, string> = {};
  export let editingRowIds: Set<number> = new Set();
  export let filterPlaceholder: string = 'Filter';
  export let showDefaultActions: boolean = true;
  export let labels: { edit?: string; done?: string; delete?: string; clearFilters?: string; clearFilter?: string } = {};
  export let density: 'regular' | 'compact' = 'regular';
  export let emptyMessage: string = 'No data';
  export let enableSorting: boolean = true;
  export let showActionsColumn: boolean = true;

  const dispatch = createEventDispatcher<{
    filterChange: { columnId: string; value: string };
    editCell: { rowId: number; columnId: string; value: string };
    toggleEdit: { rowId: number };
    deleteRow: { rowId: number };
  }>();

  function onFilterInput(columnId: string, value: string) {
    dispatch('filterChange', { columnId, value });
  }

  function onCellInput(rowId: number, columnId: string, value: string) {
    dispatch('editCell', { rowId, columnId, value });
  }

  let sortColumnId: string | null = null;
  let sortDirection: 'asc' | 'desc' | null = null;

  function onHeaderClick(col: ColumnDef<any>): void {
    if (!enableSorting || col.sortable === false) return;
    if (sortColumnId !== col.id) {
      sortColumnId = col.id;
      sortDirection = 'asc';
      return;
    }
    if (sortDirection === 'asc') {
      sortDirection = 'desc';
    } else if (sortDirection === 'desc') {
      sortColumnId = null;
      sortDirection = null;
    } else {
      sortDirection = 'asc';
    }
  }

  function getCellDisplay(row: any, col: ColumnDef<any>): string | number | null | undefined {
    return col.access ? col.access(row) : row[col.id];
  }

  function getSortValue(row: any, col: ColumnDef<any>): string | number | null | undefined {
    if (col.sortAccessor) return col.sortAccessor(row);
    if (col.access) return col.access(row);
    return row[col.id];
  }

  $: displayedRows = ((): Array<{ id: number; [k: string]: any }> => {
    if (!enableSorting || !sortColumnId || !sortDirection) return rows;
    const col = columns.find((c) => c.id === sortColumnId);
    if (!col) return rows;
    const copy = rows.slice();
    copy.sort((a, b) => {
      const va = getSortValue(a, col);
      const vb = getSortValue(b, col);
      if (va == null && vb == null) return 0;
      if (va == null) return sortDirection === 'asc' ? -1 : 1;
      if (vb == null) return sortDirection === 'asc' ? 1 : -1;
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDirection === 'asc' ? va - vb : vb - va;
      }
      const sa = String(va);
      const sb = String(vb);
      return sortDirection === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
    return copy;
  })();
</script>

<div class="gc-table-wrapper">
  <div class="gc-table__toolbar flex items-center gap-2">
    <slot name="header-actions" />
    <button
      class="btn btn--secondary btn--sm ml-auto"
      disabled={!Object.values(filters).some((v) => (v ?? '') !== '')}
      on:click={() => dispatch('filterChange', { columnId: '__clear_all__', value: '' })}
    >
      {labels.clearFilters ?? 'Clear filters'}
    </button>
  </div>
  <table class="gc-table" class:gc-table--compact={density === 'compact'}>
    <thead>
      <tr>
        {#each columns as col}
          <th
            style:width={col.width}
            class:gc-table__sortable={enableSorting && col.sortable !== false}
            class:gc-table__header--sorted={enableSorting && col.sortable !== false && sortColumnId === col.id && !!sortDirection}
            aria-sort={sortColumnId === col.id ? (sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'none') : 'none'}
            on:click={() => onHeaderClick(col)}
          >
            <span class="inline-flex items-center gap-1">
              <span>{col.title}</span>
              {#if enableSorting && col.sortable !== false}
                {#if sortColumnId === col.id && sortDirection === 'asc'}
                  <!-- Up arrow -->
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                {:else if sortColumnId === col.id && sortDirection === 'desc'}
                  <!-- Down arrow -->
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                {:else}
                  <!-- Neutral arrows -->
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="gc-table__sort-icon--muted">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                {/if}
              {/if}
            </span>
          </th>
        {/each}
        {#if showActionsColumn}
          <th class="gc-table__actions-col"></th>
        {/if}
      </tr>
      <tr>
        {#each columns as col}
          <th>
            {#if col.filterable === false}
              <div></div>
            {:else if col.filterType === 'select' && col.filterOptions}
              <div class="flex items-center gap-1">
                <select
                  class="input input--dense"
                  value={filters[col.id] ?? ''}
                  on:change={(e) => onFilterInput(col.id, (e.target as HTMLSelectElement).value)}
                >
                  <option value="">{col.placeholder ?? filterPlaceholder}</option>
                  {#each col.filterOptions as opt}
                    <option value={opt.value}>{opt.label}</option>
                  {/each}
                </select>
                {#if (filters[col.id] ?? '') !== ''}
                  <button class="btn btn--icon btn--sm" title={labels.clearFilter ?? 'Clear'} aria-label={labels.clearFilter ?? 'Clear'} on:click={() => onFilterInput(col.id, '')}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                {/if}
              </div>
            {:else if col.filterType === 'number'}
              <div class="flex items-center gap-1">
                <input
                  type="number"
                  class="input input--dense"
                  placeholder={col.placeholder ?? filterPlaceholder}
                  value={filters[col.id] ?? ''}
                  on:input={(e) => onFilterInput(col.id, (e.target as HTMLInputElement).value)}
                />
                {#if (filters[col.id] ?? '') !== ''}
                  <button class="btn btn--icon btn--sm" title={labels.clearFilter ?? 'Clear'} aria-label={labels.clearFilter ?? 'Clear'} on:click={() => onFilterInput(col.id, '')}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                {/if}
              </div>
            {:else if col.filterType === 'date'}
              <div class="flex items-center gap-1">
                <input
                  type="date"
                  class="input input--dense"
                  placeholder={col.placeholder ?? filterPlaceholder}
                  value={filters[col.id] ?? ''}
                  on:input={(e) => onFilterInput(col.id, (e.target as HTMLInputElement).value)}
                />
                {#if (filters[col.id] ?? '') !== ''}
                  <button class="btn btn--icon btn--sm" title={labels.clearFilter ?? 'Clear'} aria-label={labels.clearFilter ?? 'Clear'} on:click={() => onFilterInput(col.id, '')}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                {/if}
              </div>
            {:else}
              <div class="flex items-center gap-1">
                <input
                  class="input input--dense"
                  placeholder={col.placeholder ?? filterPlaceholder}
                  value={filters[col.id] ?? ''}
                  on:input={(e) => onFilterInput(col.id, (e.target as HTMLInputElement).value)}
                />
                {#if (filters[col.id] ?? '') !== ''}
                  <button class="btn btn--icon btn--sm" title={labels.clearFilter ?? 'Clear'} aria-label={labels.clearFilter ?? 'Clear'} on:click={() => onFilterInput(col.id, '')}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                {/if}
              </div>
            {/if}
          </th>
        {/each}
        {#if showActionsColumn}
          <th></th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#if displayedRows.length === 0}
        <tr>
          <td class="gc-table__empty" colspan={columns.length + (showActionsColumn ? 1 : 0)}>{emptyMessage}</td>
        </tr>
      {:else}
        {#each displayedRows as row (row.id)}
          <tr>
            {#each columns as col}
              <td class:gc-table__cell--sorted={enableSorting && sortColumnId === col.id && !!sortDirection}>
                {#if col.editable && editingRowIds.has(row.id)}
                  <input
                    class="input input--dense"
                    value={(getCellDisplay(row, col)) ?? ''}
                    on:input={(e) => onCellInput(row.id, col.id, (e.target as HTMLInputElement).value)}
                  />
                {:else}
                  <span class="gc-table__cell-text">{(getCellDisplay(row, col)) ?? ''}</span>
                {/if}
              </td>
            {/each}
            {#if showActionsColumn}
              <td class="gc-table__actions">
                <slot name="actions" {row} />
                {#if showDefaultActions}
                  <button class="btn btn--secondary btn--sm" on:click={() => dispatch('toggleEdit', { rowId: row.id })}>
                    {#if editingRowIds.has(row.id)}
                      <!-- Check icon -->
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <span>{labels.done ?? 'Done'}</span>
                    {:else}
                      <!-- Pencil icon -->
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                      </svg>
                      <span>{labels.edit ?? 'Edit'}</span>
                    {/if}
                  </button>
                  <button class="btn btn--secondary btn--sm" on:click={() => dispatch('deleteRow', { rowId: row.id })}>
                    <!-- Trash icon -->
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>{labels.delete ?? 'Delete'}</span>
                  </button>
                {/if}
              </td>
            {/if}
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<!-- Styles are in global SCSS: app/renderer/src/styles/components/_table.scss -->


