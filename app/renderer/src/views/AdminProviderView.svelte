<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import AdminCrud from '@components/admin/AdminCrud.svelte';
  import AdminFormModal from '@components/admin/AdminFormModal.svelte';
  import { 
    providers, 
    providerFilters, 
    loadingState,
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
    AdminTableConfig,
    AdminFieldConfig,
    FormMode
  } from '@features/admin/types';
  import { t } from '@ts/i18n';

  // Field configuration for providers - unified for both table and form
  $: fields = [
    { 
      id: 'code', 
      title: $t('pages.admin.provider.code'), 
      type: 'text',
      width: '120px',
      showInTable: true,
      showInForm: true,
      validation: { required: true, min: 2, max: 50 },
      placeholder: 'Enter provider code'
    },
    { 
      id: 'name', 
      title: $t('pages.admin.provider.name'), 
      type: 'text',
      width: '200px',
      showInTable: true,
      showInForm: true,
      validation: { required: true, min: 2, max: 100 },
      placeholder: 'Enter provider name'
    },
    { 
      id: 'url', 
      title: $t('pages.admin.provider.url'), 
      type: 'url',
      width: '250px',
      showInTable: true,
      showInForm: true,
      validation: { required: true },
      placeholder: 'https://api.example.com'
    },
    { 
      id: 'authentication', 
      title: $t('pages.admin.provider.authentication'), 
      type: 'select',
      width: '150px',
      showInTable: true,
      showInForm: true,
      validation: { required: true },
      options: AUTHENTICATION_OPTIONS,
      access: (row) => AUTHENTICATION_OPTIONS.find(opt => opt.value === row.authentication)?.label || row.authentication
    },
    { 
      id: 'configuration', 
      title: 'Configuration', 
      type: 'textarea',
      showInTable: false,
      showInForm: true,
      placeholder: '{}',
      helpText: 'JSON configuration for the provider',
      defaultValue: '{}'
    },
    { 
      id: 'createdAt', 
      title: 'Created', 
      width: '140px',
      showInTable: true,
      showInForm: false,
      readonly: true,
      access: (row) => new Date(row.createdAt).toLocaleDateString()
    }
  ];

  $: config = {
    fields,
    entityName: 'Providers',
    singularName: 'Provider'
  };

  // Modal state
  let modalOpen = false;
  let modalMode: FormMode = 'create';
  let currentProvider: Partial<Provider> = {};

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

  function handleEditRow(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    const provider = get(providers).find(p => p.id === rowId);
    if (provider) {
      currentProvider = { ...provider };
      modalMode = 'edit';
      modalOpen = true;
    }
  }

  function handleViewRow(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    const provider = get(providers).find(p => p.id === rowId);
    if (provider) {
      currentProvider = { ...provider };
      modalMode = 'view';
      modalOpen = true;
    }
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

  function handleCreateNew() {
    currentProvider = {};
    modalMode = 'create';
    modalOpen = true;
  }

  function handleDuplicate(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    const original = get(providers).find(p => p.id === rowId);
    
    if (original) {
      currentProvider = {
        code: `${original.code}-copy`,
        name: `${original.name} (Copy)`,
        url: original.url,
        authentication: original.authentication,
        configuration: original.configuration
      };
      modalMode = 'create';
      modalOpen = true;
    }
  }

  async function handleModalSubmit(event: CustomEvent<{ data: Partial<Provider>; mode: FormMode }>) {
    const { data, mode } = event.detail;
    
    try {
      if (mode === 'create') {
        const created = await createProvider(data as ProviderInsert);
        if (created) {
          providers.update(current => [...current, created]);
          modalOpen = false;
        }
      } else if (mode === 'edit') {
        const updated = await updateProvider({ id: currentProvider.id!, ...data } as ProviderUpdate);
        if (updated) {
          providers.update(current => 
            current.map(provider => provider.id === currentProvider.id ? updated : provider)
          );
          modalOpen = false;
        }
      }
    } catch (error) {
      console.error(`Failed to ${mode} provider:`, error);
    }
  }

  function handleModalClose() {
    modalOpen = false;
    currentProvider = {};
  }
</script>

<AdminCrud
  title={$t('pages.admin.provider.title')}
  description={$t('pages.admin.provider.desc')}
  data={$providers}
  {config}
  filters={$providerFilters}
  loading={$loadingState.providers}
  createButtonLabel={$t('pages.admin.provider.add')}
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
  entityName="Providers"
  singularName="Provider"
  data={currentProvider}
  loading={$loadingState.providers}
  on:submit={handleModalSubmit}
  on:close={handleModalClose}
/>