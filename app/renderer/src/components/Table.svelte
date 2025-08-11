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
              {editingRowIds.has(row.id) ? 'Done' : 'Edit'}
            </button>
            <button class="btn btn--secondary btn--sm" on:click={() => dispatch('deleteRow', { rowId: row.id })}>Delete</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<!-- Styles are in global SCSS: app/renderer/src/styles/components/_table.scss -->


