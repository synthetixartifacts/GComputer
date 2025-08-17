<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import AdminCrud from '@components/admin/AdminCrud.svelte';
  import { 
    providers, 
    providerFilters, 
    editingRows, 
    loadingState,
    setEditingRow,
    setLoading 
  } from '@features/admin/store';
  import { 
    listProviders, 
    createProvider, 
    updateProvider, 
    deleteProvider 
  } from '@features/admin/service';
  import { AUTHENTICATION_OPTIONS } from '@features/admin/types';
  import type { 
    Provider, 
    ProviderInsert, 
    ProviderUpdate, 
    AdminTableConfig 
  } from '@features/admin/types';
  import { t } from '@ts/i18n';

  // Table configuration for providers - using reactive statement to ensure translations are loaded
  $: config = {
    columns: [
      { id: 'code', title: $t('pages.admin.provider.code'), editable: true, width: '120px' },
      { id: 'name', title: $t('pages.admin.provider.name'), editable: true, width: '200px' },
      { id: 'url', title: $t('pages.admin.provider.url'), editable: true, width: '250px' },
      { 
        id: 'authentication', 
        title: $t('pages.admin.provider.authentication'), 
        editable: true, 
        width: '150px',
        access: (row) => AUTHENTICATION_OPTIONS.find(opt => opt.value === row.authentication)?.label || row.authentication
      },
      { 
        id: 'createdAt', 
        title: 'Created', 
        width: '140px',
        access: (row) => new Date(row.createdAt).toLocaleDateString()
      },
    ],
    entityName: 'Providers',
    singularName: 'Provider'
  } as AdminTableConfig<Provider>;

  let loading = false;

  onMount(async () => {
    await loadProviders();
  });

  async function loadProviders() {
    setLoading('providers', true);
    try {
      const result = await listProviders();
      providers.set(result);
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading('providers', false);
    }
  }

  function handleFilterChange(event: CustomEvent<{ columnId: string; value: string }>) {
    const { columnId, value } = event.detail;
    providerFilters.update(current => ({ ...current, [columnId]: value }));
  }

  async function handleEditCell(event: CustomEvent<{ rowId: number; columnId: string; value: string }>) {
    const { rowId, columnId, value } = event.detail;
    
    try {
      const updateData: ProviderUpdate = { id: rowId, [columnId]: value };
      const updated = await updateProvider(updateData);
      
      if (updated) {
        providers.update(current => 
          current.map(provider => provider.id === rowId ? updated : provider)
        );
      }
    } catch (error) {
      console.error('Failed to update provider:', error);
      // Reload data on error
      loadProviders();
    }
  }

  function handleToggleEdit(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    setEditingRow('providers', rowId, !get(editingRows).providers.has(rowId));
  }

  async function handleDeleteRow(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    
    try {
      const result = await deleteProvider(rowId);
      if (result.ok) {
        providers.update(current => current.filter(provider => provider.id !== rowId));
      }
    } catch (error) {
      console.error('Failed to delete provider:', error);
    }
  }

  async function handleCreateNew() {
    const newProvider: ProviderInsert = {
      code: 'new-provider',
      name: 'New Provider',
      url: 'https://api.example.com',
      authentication: 'bearer',
      configuration: '{}'
    };

    try {
      const created = await createProvider(newProvider);
      if (created) {
        providers.update(current => [...current, created]);
        // Start editing the new row
        setEditingRow('providers', created.id, true);
      }
    } catch (error) {
      console.error('Failed to create provider:', error);
    }
  }

  async function handleDuplicate(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    const original = get(providers).find(p => p.id === rowId);
    
    if (original) {
      const duplicateData: ProviderInsert = {
        code: `${original.code}-copy`,
        name: `${original.name} (Copy)`,
        url: original.url,
        authentication: original.authentication,
        configuration: original.configuration
      };

      try {
        const created = await createProvider(duplicateData);
        if (created) {
          providers.update(current => [...current, created]);
          setEditingRow('providers', created.id, true);
        }
      } catch (error) {
        console.error('Failed to duplicate provider:', error);
      }
    }
  }
</script>

<AdminCrud
  title={$t('pages.admin.provider.title')}
  description={$t('pages.admin.provider.desc')}
  data={$providers}
  {config}
  filters={$providerFilters}
  editingRowIds={$editingRows.providers}
  loading={$loadingState.providers}
  createButtonLabel={$t('pages.admin.provider.add')}
  on:filterChange={handleFilterChange}
  on:editCell={handleEditCell}
  on:toggleEdit={handleToggleEdit}
  on:deleteRow={handleDeleteRow}
  on:createNew={handleCreateNew}
  on:duplicate={handleDuplicate}
/>