<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import AdminCrud from '@components/admin/AdminCrud.svelte';
  import AdminFormModal from '@components/admin/AdminFormModal.svelte';
  import { 
    models, 
    providers,
    modelFilters, 
    loadingState,
    setLoading 
  } from '@features/admin/store';
  import { 
    listModels, 
    listProviders,
    createModel, 
    updateModel, 
    deleteModel 
  } from '@features/admin/service';
  import type { 
    Model, 
    ModelInsert, 
    ModelUpdate, 
    AdminTableConfig,
    AdminFieldConfig,
    FormMode
  } from '@features/admin/types';
  import { t } from '@ts/i18n';

  // Field configuration for models
  $: providerOptions = $providers.map(p => ({ label: p.name, value: p.id }));
  
  $: fields = [
    { 
      id: 'code', 
      title: $t('pages.admin.model.code'), 
      type: 'text',
      width: '120px',
      showInTable: true,
      showInForm: true,
      validation: { required: true, min: 2, max: 50 },
      placeholder: 'Enter model code'
    },
    { 
      id: 'name', 
      title: $t('pages.admin.model.name'), 
      type: 'text',
      width: '180px',
      showInTable: true,
      showInForm: true,
      validation: { required: true, min: 2, max: 100 },
      placeholder: 'Enter model name'
    },
    { 
      id: 'model', 
      title: $t('pages.admin.model.model'), 
      type: 'text',
      width: '160px',
      showInTable: true,
      showInForm: true,
      validation: { required: true },
      placeholder: 'gpt-4, claude-3-sonnet, etc.'
    },
    { 
      id: 'inputPrice', 
      title: $t('pages.admin.model.inputPrice'), 
      type: 'number',
      width: '100px',
      showInTable: true,
      showInForm: true,
      placeholder: '0.003',
      access: (row) => row.inputPrice ? `$${row.inputPrice}` : ''
    },
    { 
      id: 'outputPrice', 
      title: $t('pages.admin.model.outputPrice'), 
      type: 'number',
      width: '100px',
      showInTable: true,
      showInForm: true,
      placeholder: '0.015',
      access: (row) => row.outputPrice ? `$${row.outputPrice}` : ''
    },
    { 
      id: 'endpoint', 
      title: $t('pages.admin.model.endpoint'), 
      type: 'text',
      width: '200px',
      showInTable: true,
      showInForm: true,
      validation: { required: true },
      placeholder: '/v1/chat/completions'
    },
    { 
      id: 'providerId', 
      title: $t('pages.admin.model.provider'), 
      type: 'select',
      width: '150px',
      showInTable: true,
      showInForm: true,
      validation: { required: true },
      options: providerOptions,
      access: (row) => row.provider?.name || 'Unknown'
    },
    { 
      id: 'params', 
      title: 'Parameters', 
      type: 'textarea',
      showInTable: false,
      showInForm: true,
      placeholder: '{"max_tokens": 4096, "temperature": 0.7}',
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
    entityName: 'Models',
    singularName: 'Model'
  };

  // Modal state
  let modalOpen = false;
  let modalMode: FormMode = 'create';
  let currentModel: Partial<Model> = {};

  onMount(async () => {
    await Promise.all([loadModels(), loadProviders()]);
  });

  async function loadModels() {
    setLoading('models', true);
    try {
      const result = await listModels();
      models.set(result);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading('models', false);
    }
  }

  async function loadProviders() {
    try {
      const result = await listProviders();
      providers.set(result);
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  }

  function handleFilterChange(event: CustomEvent<{ columnId: string; value: string }>) {
    const { columnId, value } = event.detail;
    modelFilters.update(current => ({ ...current, [columnId]: value }));
  }

  function handleEditRow(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    const model = get(models).find(m => m.id === rowId);
    if (model) {
      currentModel = { ...model };
      modalMode = 'edit';
      modalOpen = true;
    }
  }

  function handleViewRow(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    const model = get(models).find(m => m.id === rowId);
    if (model) {
      currentModel = { ...model };
      modalMode = 'view';
      modalOpen = true;
    }
  }

  async function handleDeleteRow(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    
    try {
      const result = await deleteModel(rowId);
      if (result.ok) {
        models.update(current => current.filter(model => model.id !== rowId));
      }
    } catch (error) {
      console.error('Failed to delete model:', error);
    }
  }

  function handleCreateNew() {
    const providersList = get(providers);
    if (providersList.length === 0) {
      alert('Please create a provider first before adding models.');
      return;
    }
    
    currentModel = {};
    modalMode = 'create';
    modalOpen = true;
  }

  function handleDuplicate(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    const original = get(models).find(m => m.id === rowId);
    
    if (original) {
      currentModel = {
        code: `${original.code}-copy`,
        name: `${original.name} (Copy)`,
        model: original.model,
        inputPrice: original.inputPrice,
        outputPrice: original.outputPrice,
        endpoint: original.endpoint,
        params: original.params,
        providerId: original.providerId
      };
      modalMode = 'create';
      modalOpen = true;
    }
  }

  async function handleModalSubmit(event: CustomEvent<{ data: Partial<Model>; mode: FormMode }>) {
    const { data, mode } = event.detail;
    
    try {
      if (mode === 'create') {
        const created = await createModel(data as ModelInsert);
        if (created) {
          models.update(current => [...current, created]);
          modalOpen = false;
        }
      } else if (mode === 'edit') {
        const updated = await updateModel({ id: currentModel.id!, ...data } as ModelUpdate);
        if (updated) {
          models.update(current => 
            current.map(model => model.id === currentModel.id ? updated : model)
          );
          modalOpen = false;
        }
      }
    } catch (error) {
      console.error(`Failed to ${mode} model:`, error);
    }
  }

  function handleModalClose() {
    modalOpen = false;
    currentModel = {};
  }
</script>

<AdminCrud
  title={$t('pages.admin.model.title')}
  description={$t('pages.admin.model.desc')}
  data={$models}
  {config}
  filters={$modelFilters}
  loading={$loadingState.models}
  createButtonLabel={$t('pages.admin.model.add')}
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
  entityName="Models"
  singularName="Model"
  data={currentModel}
  loading={$loadingState.models}
  on:submit={handleModalSubmit}
  on:close={handleModalClose}
/>