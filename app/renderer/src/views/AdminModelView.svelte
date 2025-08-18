<script lang="ts">
  import AdminEntityManager from '@components/admin/AdminEntityManager.svelte';
  import { 
    models, 
    providers,
    modelFilters
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
    AdminFieldConfig
  } from '@features/admin/types';
  import { t } from '@ts/i18n';

  // Field configuration for models
  $: providerOptions = $providers.map(p => ({ label: p.name, value: p.id }));
  
  let fields: AdminFieldConfig<Model>[];
  $: fields = [
    { 
      id: 'code', 
      title: $t('common.fields.code'), 
      type: 'text' as const,
      width: '120px',
      showInTable: true,
      showInForm: true,
      validation: { required: true, min: 2, max: 50 },
      placeholder: 'Enter model code'
    },
    { 
      id: 'name', 
      title: $t('common.fields.name'), 
      type: 'text' as const,
      width: '180px',
      showInTable: true,
      showInForm: true,
      validation: { required: true, min: 2, max: 100 },
      placeholder: 'Enter model name'
    },
    { 
      id: 'model', 
      title: $t('pages.admin.model.fields.model'), 
      type: 'text' as const,
      width: '160px',
      showInTable: true,
      showInForm: true,
      validation: { required: true },
      placeholder: 'gpt-4, claude-3-sonnet, etc.'
    },
    { 
      id: 'inputPrice', 
      title: $t('pages.admin.model.fields.inputPrice'), 
      type: 'number' as const,
      width: '100px',
      showInTable: true,
      showInForm: true,
      placeholder: '0.003',
      access: (row: Model) => row.inputPrice ? `$${row.inputPrice}` : ''
    },
    { 
      id: 'outputPrice', 
      title: $t('pages.admin.model.fields.outputPrice'), 
      type: 'number' as const,
      width: '100px',
      showInTable: true,
      showInForm: true,
      placeholder: '0.015',
      access: (row: Model) => row.outputPrice ? `$${row.outputPrice}` : ''
    },
    { 
      id: 'endpoint', 
      title: $t('pages.admin.model.fields.endpoint'), 
      type: 'text' as const,
      width: '200px',
      showInTable: true,
      showInForm: true,
      validation: { required: true },
      placeholder: '/v1/chat/completions'
    },
    { 
      id: 'providerId', 
      title: $t('pages.admin.model.fields.provider'), 
      type: 'relationship' as const,
      width: '150px',
      showInTable: true,
      showInForm: true,
      validation: { required: true },
      options: providerOptions,
      relationship: {
        entityKey: 'provider',
        valueField: 'id',
        labelField: 'name'
      },
      access: (row: Model) => row.provider?.name || 'Unknown'
    },
    { 
      id: 'params', 
      title: $t('common.fields.parameters'), 
      type: 'textarea' as const,
      showInTable: false,
      showInForm: true,
      placeholder: '{"max_tokens": 4096, "temperature": 0.7}',
      defaultValue: '{}'
    },
    { 
      id: 'messageLocation', 
      title: $t('pages.admin.model.fields.messageLocation'), 
      type: 'text' as const,
      showInTable: false,
      showInForm: true,
      placeholder: 'choices.0.message.content',
      helpText: 'Path to message content in API response'
    },
    { 
      id: 'messageStreamLocation', 
      title: $t('pages.admin.model.fields.messageStreamLocation'), 
      type: 'text' as const,
      showInTable: false,
      showInForm: true,
      placeholder: 'choices.0.delta.content',
      helpText: 'Path to streaming message content in API response'
    },
    { 
      id: 'createdAt', 
      title: $t('common.fields.created'), 
      width: '140px',
      showInTable: true,
      showInForm: false,
      readonly: true,
      access: (row: Model) => new Date(row.createdAt).toLocaleDateString()
    }
  ];

  // Service configuration
  const modelService = {
    list: listModels,
    create: createModel as (data: any) => Promise<Model>,
    update: updateModel as (data: any) => Promise<Model>,
    delete: deleteModel
  };

  // Dependencies (providers are required for models)
  const dependencies = [
    {
      store: providers,
      loader: listProviders,
      name: 'Provider'
    }
  ];
</script>

<AdminEntityManager
  title={$t('pages.admin.model.title')}
  description={$t('pages.admin.model.desc')}
  createButtonLabel={$t('pages.admin.model.add')}
  entityType="model"
  {fields}
  dataStore={models}
  filtersStore={modelFilters}
  loadingKey="models"
  service={modelService}
  {dependencies}
/>