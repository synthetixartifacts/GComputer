<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { setPageTitle, clearPageTitle } from '@ts/shared/utils/page-utils';
  import AdminEntityManager from '@components/admin/AdminEntityManager.svelte';
  import { 
    configurations, 
    configurationFilters
  } from '@features/admin/store';
  import { 
    listConfigurations, 
    createConfiguration, 
    updateConfiguration, 
    deleteConfiguration 
  } from '@features/admin/service';
  import type { 
    Configuration, 
    ConfigurationInsert, 
    ConfigurationUpdate,
    AdminFieldConfig
  } from '@features/admin/types';
  import { t } from '@ts/i18n';
  
  onMount(() => {
    setPageTitle('pages.admin.configuration.title');
  });
  
  onDestroy(() => {
    clearPageTitle();
  });

  // Configuration categories for select field
  const categoryOptions = [
    { label: 'General', value: 'general' },
    { label: 'Appearance', value: 'appearance' },
    { label: 'Localization', value: 'localization' },
    { label: 'Advanced', value: 'advanced' }
  ];

  // Configuration types for select field
  const typeOptions = [
    { label: 'Text', value: 'string' },
    { label: 'Number', value: 'number' },
    { label: 'Boolean', value: 'boolean' },
    { label: 'Select', value: 'select' },
    { label: 'JSON', value: 'json' }
  ];

  // Field configuration for configurations
  let fields: AdminFieldConfig<Configuration>[];
  $: fields = [
    { 
      id: 'code', 
      title: $t('common.fields.code'), 
      type: 'text' as const,
      width: '150px',
      showInTable: true,
      showInForm: true,
      validation: { required: true, min: 2, max: 50 },
      placeholder: 'Enter configuration code'
    },
    { 
      id: 'name', 
      title: $t('common.fields.name'), 
      type: 'text' as const,
      width: '180px',
      showInTable: true,
      showInForm: true,
      validation: { required: true, min: 2, max: 100 },
      placeholder: 'Enter configuration name'
    },
    { 
      id: 'category', 
      title: $t('common.fields.category'), 
      type: 'select' as const,
      width: '120px',
      showInTable: true,
      showInForm: true,
      options: categoryOptions,
      defaultValue: 'general'
    },
    { 
      id: 'type', 
      title: $t('common.fields.type'), 
      type: 'select' as const,
      width: '100px',
      showInTable: true,
      showInForm: true,
      options: typeOptions,
      validation: { required: true }
    },
    { 
      id: 'value', 
      title: $t('common.fields.value'), 
      type: 'textarea' as const,
      width: '200px',
      showInTable: true,
      showInForm: true,
      validation: { required: true },
      placeholder: 'Enter configuration value'
    },
    { 
      id: 'defaultValue', 
      title: $t('common.fields.defaultValue'), 
      type: 'textarea' as const,
      width: '150px',
      showInTable: false,
      showInForm: true,
      validation: { required: true },
      placeholder: 'Enter default value'
    },
    { 
      id: 'options', 
      title: 'Options (JSON)', 
      type: 'textarea' as const,
      showInTable: false,
      showInForm: true,
      placeholder: '["option1", "option2"]',
      helpText: 'JSON array of options for select type'
    },
    { 
      id: 'description', 
      title: $t('common.fields.description'), 
      type: 'textarea' as const,
      width: '250px',
      showInTable: true,
      showInForm: true,
      placeholder: 'Describe this configuration'
    },
    { 
      id: 'isSystem', 
      title: 'System', 
      type: 'boolean' as const,
      width: '80px',
      showInTable: true,
      showInForm: true,
      defaultValue: false,
      access: (row: Configuration) => row.isSystem ? 'Yes' : 'No'
    },
    { 
      id: 'isSecret', 
      title: 'Secret', 
      type: 'boolean' as const,
      width: '80px',
      showInTable: true,
      showInForm: true,
      defaultValue: false,
      access: (row: Configuration) => row.isSecret ? 'Yes' : 'No'
    },
    { 
      id: 'validation', 
      title: 'Validation (JSON)', 
      type: 'textarea' as const,
      showInTable: false,
      showInForm: true,
      placeholder: '{"required": true, "min": 1}',
      helpText: 'JSON validation rules'
    },
    { 
      id: 'createdAt', 
      title: $t('common.fields.created'), 
      width: '140px',
      showInTable: true,
      showInForm: false,
      readonly: true,
      access: (row: Configuration) => new Date(row.createdAt).toLocaleDateString()
    },
    { 
      id: 'updatedAt', 
      title: $t('common.fields.updated'), 
      width: '140px',
      showInTable: true,
      showInForm: false,
      readonly: true,
      access: (row: Configuration) => new Date(row.updatedAt).toLocaleDateString()
    }
  ];

  // Service configuration
  const configurationService = {
    list: listConfigurations,
    create: createConfiguration as (data: any) => Promise<Configuration>,
    update: updateConfiguration as (data: any) => Promise<Configuration>,
    delete: deleteConfiguration
  };
</script>

<AdminEntityManager
  title={$t('pages.admin.configuration.title')}
  description={$t('pages.admin.configuration.desc')}
  createButtonLabel={$t('pages.admin.configuration.add')}
  entityType="configuration"
  {fields}
  dataStore={configurations}
  filtersStore={configurationFilters}
  loadingKey="configurations"
  service={configurationService}
/>