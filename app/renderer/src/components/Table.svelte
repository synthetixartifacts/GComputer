<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  interface ColumnDef<TRow extends { id: number }> {
    id: keyof TRow & string;
    title: string;
    editable?: boolean;
    width?: string;
    placeholder?: string;
    access?: (row: TRow) => string | number | null | undefined;
  }

  export let columns: ColumnDef<any>[] = [];
  export let rows: Array<{ id: number; [k: string]: any }> = [];
  export let filters: Record<string, string> = {};
  export let editingRowIds: Set<number> = new Set();

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
</script>

<div class="gc-table-wrapper">
  <table class="gc-table">
    <thead>
      <tr>
        {#each columns as col}
          <th style:width={col.width}>{col.title}</th>
        {/each}
        <th class="gc-table__actions-col"></th>
      </tr>
      <tr>
        {#each columns as col}
          <th>
            <input
              class="input input--dense"
              placeholder={col.placeholder ?? 'Filter'}
              value={filters[col.id] ?? ''}
              on:input={(e) => onFilterInput(col.id, (e.target as HTMLInputElement).value)}
            />
          </th>
        {/each}
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row (row.id)}
        <tr>
          {#each columns as col}
            <td>
              {#if col.editable && editingRowIds.has(row.id)}
                <input
                  class="input input--dense"
                  value={(col.access ? col.access(row) : row[col.id]) ?? ''}
                  on:input={(e) => onCellInput(row.id, col.id, (e.target as HTMLInputElement).value)}
                />
              {:else}
                <span class="gc-table__cell-text">{(col.access ? col.access(row) : row[col.id]) ?? ''}</span>
              {/if}
            </td>
          {/each}
          <td class="gc-table__actions">
            <slot name="actions" {row} />
            <button class="btn btn--secondary btn--sm" on:click={() => dispatch('toggleEdit', { rowId: row.id })}>
              {#if editingRowIds.has(row.id)}
                <!-- Check icon -->
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span>Done</span>
              {:else}
                <!-- Pencil icon -->
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
                <span>Edit</span>
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
              <span>Delete</span>
            </button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<!-- Styles are in global SCSS: app/renderer/src/styles/components/_table.scss -->


