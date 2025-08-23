<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import AdminCrud from './AdminCrud.svelte';
  import AdminFormModal from './AdminFormModal.svelte';
  import type { 
    AdminFieldConfig,
    FormMode
  } from '@features/admin/types';
  import type { Writable } from 'svelte/store';
  import { loadingState, setLoading } from '@features/admin/store';

  // Generic type for entity with required id field
  type T = $$Generic<{ id: number }>;
  
  // Service function types
  interface EntityService<TEntity, TInsert, TUpdate> {
    list: () => Promise<TEntity[]>;
    create: (data: TInsert) => Promise<TEntity>;
    update: (data: TUpdate) => Promise<TEntity>;
    delete: (id: number) => Promise<{ ok: boolean }>;
  }

  // Props
  export let title: string;
  export let description: string = '';
  export let createButtonLabel: string = 'Create';
  export let entityType: string;
  export let fields: AdminFieldConfig<T>[];
  
  // Store dependencies
  export let dataStore: Writable<T[]>;
  export let filtersStore: Writable<Record<string, string>>;
  export let loadingKey: string; 
  
  // Service functions
  export let service: EntityService<T, any, any>;
  
  // Optional dependencies (for entities that depend on others)
  export let dependencies: Array<{
    store: Writable<any[]>;
    loader: () => Promise<any[]>;
    name: string;
  }> = [];

  // Modal state
  let modalOpen = false;
  let modalMode: FormMode = 'create';
  let currentEntity: Partial<T> = {};

  // Computed config
  $: config = {
    fields,
    entityType
  };

  onMount(async () => {
    const loaders = [loadEntities()];
    
    // Load dependencies
    for (const dep of dependencies) {
      loaders.push(loadDependency(dep));
    }
    
    await Promise.all(loaders);
  });

  async function loadEntities() {
    setLoading(loadingKey as any, true);
    try {
      const result = await service.list();
      dataStore.set(result);
    } catch (error) {
      console.error(`Failed to load ${entityType}:`, error);
    } finally {
      setLoading(loadingKey as any, false);
    }
  }

  async function loadDependency(dep: typeof dependencies[0]) {
    try {
      const result = await dep.loader();
      dep.store.set(result);
    } catch (error) {
      console.error(`Failed to load ${dep.name}:`, error);
    }
  }

  function handleFilterChange(event: CustomEvent<{ columnId: string; value: string }>) {
    const { columnId, value } = event.detail;
    filtersStore.update(current => ({ ...current, [columnId]: value }));
  }

  function handleEditRow(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    const entity = get(dataStore).find(e => e.id === rowId);
    if (entity) {
      currentEntity = { ...entity };
      modalMode = 'edit';
      modalOpen = true;
    }
  }

  function handleViewRow(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    const entity = get(dataStore).find(e => e.id === rowId);
    if (entity) {
      currentEntity = { ...entity };
      modalMode = 'view';
      modalOpen = true;
    }
  }

  async function handleDeleteRow(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    
    try {
      const result = await service.delete(rowId);
      if (result.ok) {
        dataStore.update(current => current.filter(entity => entity.id !== rowId));
      }
    } catch (error) {
      console.error(`Failed to delete ${entityType}:`, error);
    }
  }

  function handleCreateNew() {
    // Check dependencies if any are required
    for (const dep of dependencies) {
      const depData = get(dep.store);
      if (depData.length === 0) {
        alert(`Please create a ${dep.name.toLowerCase()} first before adding ${entityType}.`);
        return;
      }
    }
    
    currentEntity = {};
    modalMode = 'create';
    modalOpen = true;
  }

  function handleDuplicate(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    const original = get(dataStore).find(e => e.id === rowId);
    
    if (original) {
      // Create a copy with modified unique fields
      const duplicated = { ...original };
      delete (duplicated as any).id;
      delete (duplicated as any).createdAt;
      delete (duplicated as any).updatedAt;
      
      // Add "(Copy)" to common fields
      if ('code' in duplicated && duplicated.code) {
        duplicated.code = `${duplicated.code}-copy`;
      }
      if ('name' in duplicated && duplicated.name) {
        duplicated.name = `${duplicated.name} (Copy)`;
      }
      
      // Reset system-specific flags for agents
      if ('isSystem' in duplicated) {
        duplicated.isSystem = false;
      }
      
      currentEntity = duplicated;
      modalMode = 'duplicate';
      modalOpen = true;
    }
  }

  async function handleModalSubmit(event: CustomEvent<{ data: Partial<T>; mode: FormMode }>) {
    const { data, mode } = event.detail;
    
    try {
      if (mode === 'create' || mode === 'duplicate') {
        const created = await service.create(data);
        if (created) {
          // Refresh entire list to ensure we get complete relationship data
          await loadEntities();
          modalOpen = false;
        }
      } else if (mode === 'edit') {
        const updated = await service.update({ id: currentEntity.id!, ...data });
        if (updated) {
          // Refresh entire list to ensure we get complete relationship data
          // This is necessary because update operations may not return full relationship objects
          await loadEntities();
          modalOpen = false;
        }
      }
    } catch (error) {
      console.error(`Failed to ${mode} ${entityType}:`, error);
    }
  }

  function handleModalClose() {
    modalOpen = false;
    currentEntity = {};
  }
</script>

<AdminCrud
  {title}
  {description}
  data={$dataStore}
  {config}
  filters={$filtersStore}
  loading={$loadingState[loadingKey as keyof typeof $loadingState]}
  {createButtonLabel}
  on:filterChange={handleFilterChange}
  on:editRow={handleEditRow}
  on:viewRow={handleViewRow}
  on:deleteRow={handleDeleteRow}
  on:createNew={handleCreateNew}
  on:duplicate={handleDuplicate}
/>

<AdminFormModal
  open={modalOpen}
  mode={modalMode}
  {fields}
  {entityType}
  data={currentEntity}
  loading={$loadingState[loadingKey as keyof typeof $loadingState]}
  on:submit={handleModalSubmit}
  on:close={handleModalClose}
/>
