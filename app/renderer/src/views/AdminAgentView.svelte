<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import AdminCrud from '@components/admin/AdminCrud.svelte';
  import AdminFormModal from '@components/admin/AdminFormModal.svelte';
  import { 
    agents, 
    models,
    agentFilters, 
    loadingState,
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
    AdminTableConfig,
    AdminFieldConfig,
    FormMode
  } from '@features/admin/types';
  import { t } from '@ts/i18n';

  // Field configuration for agents
  $: modelOptions = $models.map(m => ({ label: m.name, value: m.id }));
  
  $: fields = [
    { 
      id: 'code', 
      title: $t('pages.admin.agent.code'), 
      type: 'text',
      width: '120px',
      showInTable: true,
      showInForm: true,
      validation: { required: true, min: 2, max: 50 },
      placeholder: 'Enter agent code'
    },
    { 
      id: 'name', 
      title: $t('pages.admin.agent.name'), 
      type: 'text',
      width: '180px',
      showInTable: true,
      showInForm: true,
      validation: { required: true, min: 2, max: 100 },
      placeholder: 'Enter agent name'
    },
    { 
      id: 'description', 
      title: $t('pages.admin.agent.description'), 
      type: 'textarea',
      width: '250px',
      showInTable: true,
      showInForm: true,
      placeholder: 'Describe what this agent does'
    },
    { 
      id: 'version', 
      title: $t('pages.admin.agent.version'), 
      type: 'text',
      width: '80px',
      showInTable: true,
      showInForm: true,
      defaultValue: '1.0',
      placeholder: '1.0'
    },
    { 
      id: 'enable', 
      title: $t('pages.admin.agent.enable'), 
      type: 'boolean',
      width: '80px',
      showInTable: true,
      showInForm: true,
      defaultValue: true,
      access: (row) => row.enable ? 'Yes' : 'No'
    },
    { 
      id: 'isSystem', 
      title: $t('pages.admin.agent.isSystem'), 
      type: 'boolean',
      width: '80px',
      showInTable: true,
      showInForm: true,
      defaultValue: false,
      access: (row) => row.isSystem ? 'Yes' : 'No'
    },
    { 
      id: 'modelId', 
      title: $t('pages.admin.agent.model'), 
      type: 'select',
      width: '150px',
      showInTable: true,
      showInForm: true,
      validation: { required: true },
      options: modelOptions,
      access: (row) => row.model?.name || 'Unknown'
    },
    { 
      id: 'systemPrompt', 
      title: 'System Prompt', 
      type: 'textarea',
      showInTable: false,
      showInForm: true,
      placeholder: 'You are a helpful AI assistant...'
    },
    { 
      id: 'configuration', 
      title: 'Configuration', 
      type: 'textarea',
      showInTable: false,
      showInForm: true,
      placeholder: '{\"useMemory\": true}',
      defaultValue: '{}'
    },
    { 
      id: 'provider', 
      title: $t('pages.admin.agent.provider'), 
      width: '120px',
      showInTable: true,
      showInForm: false,
      readonly: true,
      access: (row) => row.provider?.name || 'Unknown'
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
    entityName: 'Agents',
    singularName: 'Agent'
  };

  // Modal state
  let modalOpen = false;
  let modalMode: FormMode = 'create';
  let currentAgent: Partial<Agent> = {};

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

  function handleEditRow(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    const agent = get(agents).find(a => a.id === rowId);
    if (agent) {
      currentAgent = { ...agent };
      modalMode = 'edit';
      modalOpen = true;
    }
  }

  function handleViewRow(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    const agent = get(agents).find(a => a.id === rowId);
    if (agent) {
      currentAgent = { ...agent };
      modalMode = 'view';
      modalOpen = true;
    }
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

  function handleCreateNew() {
    const modelsList = get(models);
    if (modelsList.length === 0) {
      alert('Please create a model first before adding agents.');
      return;
    }
    
    currentAgent = {};
    modalMode = 'create';
    modalOpen = true;
  }

  function handleDuplicate(event: CustomEvent<{ rowId: number }>) {
    const { rowId } = event.detail;
    const original = get(agents).find(a => a.id === rowId);
    
    if (original) {
      currentAgent = {
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
      modalMode = 'create';
      modalOpen = true;
    }
  }

  async function handleModalSubmit(event: CustomEvent<{ data: Partial<Agent>; mode: FormMode }>) {
    const { data, mode } = event.detail;
    
    try {
      if (mode === 'create') {
        const created = await createAgent(data as AgentInsert);
        if (created) {
          agents.update(current => [...current, created]);
          modalOpen = false;
        }
      } else if (mode === 'edit') {
        const updated = await updateAgent({ id: currentAgent.id!, ...data } as AgentUpdate);
        if (updated) {
          agents.update(current => 
            current.map(agent => agent.id === currentAgent.id ? updated : agent)
          );
          modalOpen = false;
        }
      }
    } catch (error) {
      console.error(`Failed to ${mode} agent:`, error);
    }
  }

  function handleModalClose() {
    modalOpen = false;
    currentAgent = {};
  }
</script>

<AdminCrud
  title={$t('pages.admin.agent.title')}
  description={$t('pages.admin.agent.desc')}
  data={$agents}
  {config}
  filters={$agentFilters}
  loading={$loadingState.agents}
  createButtonLabel={$t('pages.admin.agent.add')}
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
  entityName="Agents"
  singularName="Agent"
  data={currentAgent}
  loading={$loadingState.agents}
  on:submit={handleModalSubmit}
  on:close={handleModalClose}
/>