<script lang="ts">
  /**
   * Generic CRUD component for admin entities
   * Uses the existing Table component with admin-specific functionality
   */
  import { createEventDispatcher, onMount } from 'svelte';
  import Table from '@components/Table.svelte';
  import type { AdminTableConfig } from '@features/admin/types';

  interface Props<T extends { id: number }> {
    title: string;
    description?: string;
    data: T[];
    config: AdminTableConfig<T>;
    filters: Record<string, string>;
    editingRowIds: Set<number>;
    loading?: boolean;
    createButtonLabel?: string;
  }

  // Use generic type parameter
  type T = $$Generic<{ id: number }>;
  
  export let title: string;
  export let description: string = '';
  export let data: T[] = [];
  export let config: AdminTableConfig<T>;
  export let filters: Record<string, string> = {};
  export let loading: boolean = false;
  export let createButtonLabel: string = 'Create';

  const dispatch = createEventDispatcher<{
    filterChange: { columnId: string; value: string };
    editRow: { rowId: number };
    viewRow: { rowId: number };
    deleteRow: { rowId: number };
    createNew: void;
    duplicate: { rowId: number };
  }>();

  function handleFilterChange(event: CustomEvent<{ columnId: string; value: string }>) {
    dispatch('filterChange', event.detail);
  }

  function handleEditRow(rowId: number) {
    dispatch('editRow', { rowId });
  }

  function handleViewRow(rowId: number) {
    dispatch('viewRow', { rowId });
  }

  function handleDeleteRow(event: CustomEvent<{ rowId: number }>) {
    if (confirm(`Are you sure you want to delete this ${config.singularName.toLowerCase()}?`)) {
      dispatch('deleteRow', event.detail);
    }
  }

  function handleCreateNew() {
    dispatch('createNew');
  }

  function handleDuplicate(rowId: number) {
    dispatch('duplicate', { rowId });
  }

  // Transform config for table display - only show fields marked for table
  $: tableColumns = config.fields
    .filter(field => field.showInTable !== false)
    .map(field => ({
      id: field.id,
      title: field.title,
      editable: false, // Disable inline editing
      width: field.width,
      access: field.access,
    }));

  // Transform data for table display
  $: tableRows = data.map(item => ({
    ...item,
    id: item.id
  }));
</script>

<div class="admin-crud">
  <div class="admin-crud__header">
    <div class="admin-crud__header-content">
      <h1 class="admin-crud__title">{title}</h1>
      {#if description}
        <p class="admin-crud__description">{description}</p>
      {/if}
    </div>
    <div class="admin-crud__actions">
      <button 
        class="btn btn--primary" 
        on:click={handleCreateNew}
        disabled={loading}
      >
        {createButtonLabel}
      </button>
    </div>
  </div>

  {#if loading}
    <div class="admin-crud__loading">
      <div class="loader"></div>
      <span>Loading {config.entityName.toLowerCase()}...</span>
    </div>
  {:else}
    <div class="admin-crud__table">
      <Table
        columns={tableColumns}
        rows={tableRows}
        {filters}
        editingRowIds={new Set()}
        showDefaultActions={false}
        on:filterChange={handleFilterChange}
      >
        <svelte:fragment slot="header-actions">
          <div class="admin-crud__table-actions">
            <span class="admin-crud__count">
              {tableRows.length} {tableRows.length === 1 ? config.singularName : config.entityName}
            </span>
          </div>
        </svelte:fragment>

        <svelte:fragment slot="actions" let:row>
          <div class="admin-crud__row-actions">
            <button 
              class="btn btn--sm btn--secondary admin-crud__action-btn"
              on:click={() => handleViewRow(row.id)}
              title="View this {config.singularName.toLowerCase()}"
            >
              👁️
            </button>
            <button 
              class="btn btn--sm btn--primary admin-crud__action-btn"
              on:click={() => handleEditRow(row.id)}
              title="Edit this {config.singularName.toLowerCase()}"
            >
              ✏️
            </button>
            <button 
              class="btn btn--sm btn--secondary admin-crud__action-btn"
              on:click={() => handleDuplicate(row.id)}
              title="Duplicate this {config.singularName.toLowerCase()}"
            >
              📋
            </button>
            <button 
              class="btn btn--sm btn--danger admin-crud__action-btn"
              on:click={() => handleDeleteRow({ detail: { rowId: row.id } })}
              title="Delete this {config.singularName.toLowerCase()}"
            >
              🗑️
            </button>
          </div>
        </svelte:fragment>
      </Table>
    </div>
  {/if}
</div>

<style lang="scss">
  .admin-crud {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 1rem;

    &__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      
      @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
      }
    }

    &__header-content {
      flex: 1;
    }

    &__title {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 0.5rem;
      color: var(--color-text);
    }

    &__description {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.875rem;
    }

    &__actions {
      display: flex;
      gap: 0.5rem;
      
      @media (max-width: 768px) {
        justify-content: stretch;
        
        .btn {
          flex: 1;
        }
      }
    }

    &__table {
      flex: 1;
      overflow: hidden;
    }

    &__table-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    &__count {
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    &__loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem;
      color: var(--color-text-muted);
    }

    &__row-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;

      @media (max-width: 768px) {
        flex-direction: column;
        gap: 0.25rem;
      }
    }

    &__action-btn {
      min-width: 2rem;
      padding: 0.25rem 0.5rem;
      font-size: 1rem;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
</style>