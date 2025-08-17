<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import AdminCrud from '@components/admin/AdminCrud.svelte';
  import { 
    agents, 
    models,
    agentFilters, 
    editingRows, 
    loadingState,
    setEditingRow,
    setLoading 
  } from '@features/admin/store';
  import { 
    listAgents, 
    listModels,
    createAgent, 
    updateAgent, 
    deleteAgent 
  } from '@features/admin/service';
  import type { 
    Agent, 
    AgentInsert, 
    AgentUpdate, 
    AdminTableConfig 
  } from '@features/admin/types';
  import { t } from '@ts/i18n';

  // Table configuration for agents - using reactive statement to ensure translations are loaded
  $: config = {
    columns: [
      { id: 'code', title: $t('pages.admin.agent.code'), editable: true, width: '120px' },
      { id: 'name', title: $t('pages.admin.agent.name'), editable: true, width: '180px' },
      { id: 'description', title: $t('pages.admin.agent.description'), editable: true, width: '250px' },
      { id: 'version', title: $t('pages.admin.agent.version'), editable: true, width: '80px' },
      { 
        id: 'enable', 
        title: $t('pages.admin.agent.enable'), 
        editable: true, 
        width: '80px',
        access: (row) => row.enable ? 'Yes' : 'No'
      },
      { 
        id: 'isSystem', 
        title: $t('pages.admin.agent.isSystem'), 
        editable: true, 
        width: '80px',
        access: (row) => row.isSystem ? 'Yes' : 'No'
      },
      { 
        id: 'modelId', 
        title: $t('pages.admin.agent.model'), 
        width: '150px',
        access: (row) => row.model?.name || 'Unknown'
      },
      { 
        id: 'provider', 
        title: $t('pages.admin.agent.provider'), 
        width: '120px',
        access: (row) => row.provider?.name || 'Unknown'
      },
      { 
        id: 'createdAt', 
        title: 'Created', 
        width: '140px',
        access: (row) => new Date(row.createdAt).toLocaleDateString()
      },
    ],
    entityName: 'Agents',
    singularName: 'Agent'
  } as AdminTableConfig<Agent>;

  let loading = false;

  onMount(async () => {
    await Promise.all([loadAgents(), loadModels()]);
  });

  async function loadAgents() {
    setLoading('agents', true);
    try {
      const result = await listAgents();
      agents.set(result);
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading('agents', false);
    }
  }

  async function loadModels() {
    try {
      const result = await listModels();
      models.set(result);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  }

  function handleFilterChange(event: CustomEvent<{ columnId: string; value: string }>) {
    const { columnId, value } = event.detail;
    agentFilters.update(current => ({ ...current, [columnId]: value }));
  }

  async function handleEditCell(event: CustomEvent<{ rowId: number; columnId: string; value: string }>) {
    const { rowId, columnId, value } = event.detail;
    
    try {
      let processedValue: any = value;
      
      // Handle boolean fields
      if (columnId === 'enable' || columnId === 'isSystem') {
        processedValue = value.toLowerCase() === 'yes' || value === 'true';
      } else if (columnId === 'modelId') {
        processedValue = parseInt(value);
      }
      
      const updateData: AgentUpdate = { id: rowId, [columnId]: processedValue };
      const updated = await updateAgent(updateData);
      
      if (updated) {
        agents.update(current => 
          current.map(agent => agent.id === rowId ? updated : agent)
        );
      }
    } catch (error) {
      console.error('Failed to update agent:', error);
      // Reload data on error
      loadAgents();
    }
  }

  function handleToggleEdit(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    setEditingRow('agents', rowId, !get(editingRows).agents.has(rowId));
  }

  async function handleDeleteRow(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    
    try {
      const result = await deleteAgent(rowId);
      if (result.ok) {
        agents.update(current => current.filter(agent => agent.id !== rowId));
      }
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  }

  async function handleCreateNew() {
    const modelsList = get(models);
    const firstModel = modelsList[0];
    
    if (!firstModel) {
      alert('Please create a model first before adding agents.');
      return;
    }

    const newAgent: AgentInsert = {
      code: 'new-agent',
      name: 'New Agent',
      description: 'A new AI agent',
      version: '1.0',
      enable: true,
      isSystem: false,
      systemPrompt: 'You are a helpful AI assistant.',
      configuration: '{}',
      modelId: firstModel.id
    };

    try {
      const created = await createAgent(newAgent);
      if (created) {
        agents.update(current => [...current, created]);
        // Start editing the new row
        setEditingRow('agents', created.id, true);
      }
    } catch (error) {
      console.error('Failed to create agent:', error);
    }
  }

  async function handleDuplicate(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    const original = get(agents).find(a => a.id === rowId);
    
    if (original) {
      const duplicateData: AgentInsert = {
        code: `${original.code}-copy`,
        name: `${original.name} (Copy)`,
        description: original.description,
        version: original.version,
        enable: original.enable,
        isSystem: false, // Always create duplicates as non-system
        systemPrompt: original.systemPrompt,
        configuration: original.configuration,
        modelId: original.modelId
      };

      try {
        const created = await createAgent(duplicateData);
        if (created) {
          agents.update(current => [...current, created]);
          setEditingRow('agents', created.id, true);
        }
      } catch (error) {
        console.error('Failed to duplicate agent:', error);
      }
    }
  }
</script>

<AdminCrud
  title={$t('pages.admin.agent.title')}
  description={$t('pages.admin.agent.desc')}
  data={$agents}
  {config}
  filters={$agentFilters}
  editingRowIds={$editingRows.agents}
  loading={$loadingState.agents}
  createButtonLabel={$t('pages.admin.agent.add')}
  on:filterChange={handleFilterChange}
  on:editCell={handleEditCell}
  on:toggleEdit={handleToggleEdit}
  on:deleteRow={handleDeleteRow}
  on:createNew={handleCreateNew}
  on:duplicate={handleDuplicate}
/>