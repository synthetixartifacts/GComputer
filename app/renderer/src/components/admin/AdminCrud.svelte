<script lang="ts">
  /**
   * Generic CRUD component for admin entities
   * Uses the existing Table component with admin-specific functionality
   */
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import Table from '@components/Table.svelte';
  import type { AdminTableConfig } from '@features/admin/types';
  import { t as tStore } from '@ts/i18n/store';
  
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());

  // Utility function to get translation path for entity type
  function getEntityTranslationPath(entityType: string, key: string): string {
    if (entityType.includes('.')) {
      // Handle paths like 'db.test'
      return `pages.${entityType}.${key}`;
    } else {
      // Handle admin entity types like 'provider', 'model', 'agent'
      return `pages.admin.${entityType}.${key}`;
    }
  }

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
    if (confirm(`${t('common.actions.delete')} ${t(getEntityTranslationPath(config.entityType, 'singular')).toLowerCase()}?`)) {
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
      editable: false, 
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
      <span>{t('common.states.loading')} {t(getEntityTranslationPath(config.entityType, 'title')).toLowerCase()}...</span>
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
              {tableRows.length} {tableRows.length === 1 ? t(getEntityTranslationPath(config.entityType, 'singular')) : t(getEntityTranslationPath(config.entityType, 'title'))}
            </span>
          </div>
        </svelte:fragment>

        <svelte:fragment slot="actions" let:row>
          <div class="admin-crud__row-actions">
            <button 
              class="btn btn--sm btn--secondary admin-crud__action-btn"
              on:click={() => handleViewRow(row.id)}
              title="{t('common.actions.view')} {t(getEntityTranslationPath(config.entityType, 'singular')).toLowerCase()}"
            >
              👁️
            </button>
            <button 
              class="btn btn--sm btn--primary admin-crud__action-btn"
              on:click={() => handleEditRow(row.id)}
              title="{t('common.actions.edit')} {t(getEntityTranslationPath(config.entityType, 'singular')).toLowerCase()}"
            >
              ✏️
            </button>
            <button 
              class="btn btn--sm btn--secondary admin-crud__action-btn"
              on:click={() => handleDuplicate(row.id)}
              title="{t('common.actions.duplicate')} {t(getEntityTranslationPath(config.entityType, 'singular')).toLowerCase()}"
            >
              📋
            </button>
            <button 
              class="btn btn--sm btn--danger admin-crud__action-btn"
              on:click={() => handleDeleteRow(new CustomEvent('delete', { detail: { rowId: row.id } }))}
              title="{t('common.actions.delete')} {t(getEntityTranslationPath(config.entityType, 'singular')).toLowerCase()}"
            >
              🗑️
            </button>
          </div>
        </svelte:fragment>
      </Table>
    </div>
  {/if}
</div>