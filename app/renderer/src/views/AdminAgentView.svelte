<script lang="ts">
  import AdminEntityManager from '@components/admin/AdminEntityManager.svelte';
  import { 
    agents, 
    models,
    agentFilters
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
    AdminFieldConfig
  } from '@features/admin/types';
  import { t } from '@ts/i18n';

  // Field configuration for agents
  $: modelOptions = $models.map(m => ({ label: m.name, value: m.id }));
  
  let fields: AdminFieldConfig<Agent>[];
  $: fields = [
    { 
      id: 'code', 
      title: $t('pages.admin.agent.code'), 
      type: 'text' as const,
      width: '120px',
      showInTable: true,
      showInForm: true,
      validation: { required: true, min: 2, max: 50 },
      placeholder: 'Enter agent code'
    },
    { 
      id: 'name', 
      title: $t('pages.admin.agent.name'), 
      type: 'text' as const,
      width: '180px',
      showInTable: true,
      showInForm: true,
      validation: { required: true, min: 2, max: 100 },
      placeholder: 'Enter agent name'
    },
    { 
      id: 'description', 
      title: $t('pages.admin.agent.description'), 
      type: 'textarea' as const,
      width: '250px',
      showInTable: true,
      showInForm: true,
      placeholder: 'Describe what this agent does'
    },
    { 
      id: 'version', 
      title: $t('pages.admin.agent.version'), 
      type: 'text' as const,
      width: '80px',
      showInTable: true,
      showInForm: true,
      defaultValue: '1.0',
      placeholder: '1.0'
    },
    { 
      id: 'enable', 
      title: $t('pages.admin.agent.enable'), 
      type: 'boolean' as const,
      width: '80px',
      showInTable: true,
      showInForm: true,
      defaultValue: true,
      access: (row: Agent) => row.enable ? 'Yes' : 'No'
    },
    { 
      id: 'isSystem', 
      title: $t('pages.admin.agent.isSystem'), 
      type: 'boolean' as const,
      width: '80px',
      showInTable: true,
      showInForm: true,
      defaultValue: false,
      access: (row: Agent) => row.isSystem ? 'Yes' : 'No'
    },
    { 
      id: 'modelId', 
      title: $t('pages.admin.agent.model'), 
      type: 'relationship' as const,
      width: '150px',
      showInTable: true,
      showInForm: true,
      validation: { required: true },
      options: modelOptions,
      relationship: {
        entityKey: 'model',
        valueField: 'id',
        labelField: 'name'
      },
      access: (row: Agent) => row.model?.name || 'Unknown'
    },
    { 
      id: 'systemPrompt', 
      title: 'System Prompt', 
      type: 'textarea' as const,
      showInTable: false,
      showInForm: true,
      placeholder: 'You are a helpful AI assistant...'
    },
    { 
      id: 'configuration', 
      title: 'Configuration', 
      type: 'textarea' as const,
      showInTable: false,
      showInForm: true,
      placeholder: '{"useMemory": true}',
      defaultValue: '{}'
    },
    { 
      id: 'provider', 
      title: $t('pages.admin.agent.provider'), 
      width: '120px',
      showInTable: true,
      showInForm: false,
      readonly: true,
      access: (row: Agent) => row.provider?.name || 'Unknown'
    },
    { 
      id: 'createdAt', 
      title: 'Created', 
      width: '140px',
      showInTable: true,
      showInForm: false,
      readonly: true,
      access: (row: Agent) => new Date(row.createdAt).toLocaleDateString()
    }
  ];

  // Service configuration
  const agentService = {
    list: listAgents,
    create: createAgent as (data: any) => Promise<Agent>,
    update: updateAgent as (data: any) => Promise<Agent>,
    delete: deleteAgent
  };

  // Dependencies (models are required for agents)
  const dependencies = [
    {
      store: models,
      loader: listModels,
      name: 'Model'
    }
  ];
</script>

<AdminEntityManager
  title={$t('pages.admin.agent.title')}
  description={$t('pages.admin.agent.desc')}
  createButtonLabel={$t('pages.admin.agent.add')}
  entityName="Agents"
  singularName="Agent"
  {fields}
  dataStore={agents}
  filtersStore={agentFilters}
  loadingKey="agents"
  service={agentService}
  {dependencies}
/>