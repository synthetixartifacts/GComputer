<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import AdminCrud from '@components/admin/AdminCrud.svelte';
  import { 
    models, 
    providers,
    modelFilters, 
    editingRows, 
    loadingState,
    setEditingRow,
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
    AdminTableConfig 
  } from '@features/admin/types';
  import { t } from '@ts/i18n';

  // Table configuration for models - using reactive statement to ensure translations are loaded
  $: config = {
    columns: [
      { id: 'code', title: $t('pages.admin.model.code'), editable: true, width: '120px' },
      { id: 'name', title: $t('pages.admin.model.name'), editable: true, width: '180px' },
      { id: 'model', title: $t('pages.admin.model.model'), editable: true, width: '160px' },
      { 
        id: 'inputPrice', 
        title: $t('pages.admin.model.inputPrice'), 
        editable: true, 
        width: '100px',
        access: (row) => row.inputPrice ? `$${row.inputPrice}` : ''
      },
      { 
        id: 'outputPrice', 
        title: $t('pages.admin.model.outputPrice'), 
        editable: true, 
        width: '100px',
        access: (row) => row.outputPrice ? `$${row.outputPrice}` : ''
      },
      { id: 'endpoint', title: $t('pages.admin.model.endpoint'), editable: true, width: '200px' },
      { 
        id: 'providerId', 
        title: $t('pages.admin.model.provider'), 
        width: '150px',
        access: (row) => row.provider?.name || 'Unknown'
      },
      { 
        id: 'createdAt', 
        title: 'Created', 
        width: '140px',
        access: (row) => new Date(row.createdAt).toLocaleDateString()
      },
    ],
    entityName: 'Models',
    singularName: 'Model'
  } as AdminTableConfig<Model>;

  let loading = false;

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

  async function handleEditCell(event: CustomEvent<{ rowId: number; columnId: string; value: string }>) {
    const { rowId, columnId, value } = event.detail;
    
    try {
      let processedValue: any = value;
      
      // Handle numeric fields
      if (columnId === 'inputPrice' || columnId === 'outputPrice') {
        processedValue = value ? parseFloat(value) : null;
      } else if (columnId === 'providerId') {
        processedValue = parseInt(value);
      }
      
      const updateData: ModelUpdate = { id: rowId, [columnId]: processedValue };
      const updated = await updateModel(updateData);
      
      if (updated) {
        models.update(current => 
          current.map(model => model.id === rowId ? updated : model)
        );
      }
    } catch (error) {
      console.error('Failed to update model:', error);
      // Reload data on error
      loadModels();
    }
  }

  function handleToggleEdit(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    setEditingRow('models', rowId, !get(editingRows).models.has(rowId));
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

  async function handleCreateNew() {
    const providersList = get(providers);
    const firstProvider = providersList[0];
    
    if (!firstProvider) {
      alert('Please create a provider first before adding models.');
      return;
    }

    const newModel: ModelInsert = {
      code: 'new-model',
      name: 'New Model',
      model: 'new-model-v1',
      endpoint: '/v1/chat/completions',
      params: '{"max_tokens": 4096}',
      providerId: firstProvider.id
    };

    try {
      const created = await createModel(newModel);
      if (created) {
        models.update(current => [...current, created]);
        // Start editing the new row
        setEditingRow('models', created.id, true);
      }
    } catch (error) {
      console.error('Failed to create model:', error);
    }
  }

  async function handleDuplicate(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    const original = get(models).find(m => m.id === rowId);
    
    if (original) {
      const duplicateData: ModelInsert = {
        code: `${original.code}-copy`,
        name: `${original.name} (Copy)`,
        model: original.model,
        inputPrice: original.inputPrice,
        outputPrice: original.outputPrice,
        endpoint: original.endpoint,
        params: original.params,
        messageLocation: original.messageLocation,
        streamMessageLocation: original.streamMessageLocation,
        inputTokenCountLocation: original.inputTokenCountLocation,
        outputTokenCountLocation: original.outputTokenCountLocation,
        providerId: original.providerId
      };

      try {
        const created = await createModel(duplicateData);
        if (created) {
          models.update(current => [...current, created]);
          setEditingRow('models', created.id, true);
        }
      } catch (error) {
        console.error('Failed to duplicate model:', error);
      }
    }
  }
</script>

<AdminCrud
  title={$t('pages.admin.model.title')}
  description={$t('pages.admin.model.desc')}
  data={$models}
  {config}
  filters={$modelFilters}
  editingRowIds={$editingRows.models}
  loading={$loadingState.models}
  createButtonLabel={$t('pages.admin.model.add')}
  on:filterChange={handleFilterChange}
  on:editCell={handleEditCell}
  on:toggleEdit={handleToggleEdit}
  on:deleteRow={handleDeleteRow}
  on:createNew={handleCreateNew}
  on:duplicate={handleDuplicate}
/>