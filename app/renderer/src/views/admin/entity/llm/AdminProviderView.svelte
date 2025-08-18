<script lang="ts">
  import AdminEntityManager from '@components/admin/AdminEntityManager.svelte';
  import { 
    providers, 
    providerFilters
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
    AdminFieldConfig
  } from '@features/admin/types';
  import { t } from '@ts/i18n';

  // Field configuration for providers
  let fields: AdminFieldConfig<Provider>[];
  $: fields = [
    { 
      id: 'code', 
      title: $t('common.fields.code'), 
      type: 'text' as const,
      width: '120px',
      showInTable: true,
      showInForm: true,
      validation: { required: true, min: 2, max: 50 },
      placeholder: 'Enter provider code'
    },
    { 
      id: 'name', 
      title: $t('common.fields.name'), 
      type: 'text' as const,
      width: '200px',
      showInTable: true,
      showInForm: true,
      validation: { required: true, min: 2, max: 100 },
      placeholder: 'Enter provider name'
    },
    { 
      id: 'url', 
      title: $t('pages.admin.provider.fields.url'), 
      type: 'url' as const,
      width: '250px',
      showInTable: true,
      showInForm: true,
      validation: { required: true },
      placeholder: 'https://api.example.com'
    },
    { 
      id: 'authentication', 
      title: $t('pages.admin.provider.fields.authentication'), 
      type: 'select' as const,
      width: '150px',
      showInTable: true,
      showInForm: true,
      validation: { required: true },
      options: [...AUTHENTICATION_OPTIONS],
      access: (row: Provider) => AUTHENTICATION_OPTIONS.find(opt => opt.value === row.authentication)?.label || row.authentication
    },
    { 
      id: 'secretKey', 
      title: $t('pages.admin.provider.fields.secretKey'), 
      type: 'text' as const,
      showInTable: false,
      showInForm: true,
      placeholder: 'Enter your API key or secret',
      helpText: 'Secret key/API key for authentication (stored as plain text)'
    },
    { 
      id: 'configuration', 
      title: $t('common.fields.configuration'), 
      type: 'textarea' as const,
      showInTable: false,
      showInForm: true,
      placeholder: '{}',
      helpText: 'JSON configuration for the provider',
      defaultValue: '{}'
    },
    { 
      id: 'createdAt', 
      title: $t('common.fields.created'), 
      width: '140px',
      showInTable: true,
      showInForm: false,
      readonly: true,
      access: (row: Provider) => new Date(row.createdAt).toLocaleDateString()
    }
  ];

  // Service configuration
  const providerService = {
    list: listProviders,
    create: createProvider as (data: any) => Promise<Provider>,
    update: updateProvider as (data: any) => Promise<Provider>,
    delete: deleteProvider
  };

  // No dependencies for providers (they are the root entity)
  const dependencies: Array<{
    store: any;
    loader: () => Promise<any[]>;
    name: string;
  }> = [];
</script>

<AdminEntityManager
  title={$t('pages.admin.provider.title')}
  description={$t('pages.admin.provider.desc')}
  createButtonLabel={$t('pages.admin.provider.add')}
  entityType="provider"
  {fields}
  dataStore={providers}
  filtersStore={providerFilters}
  loadingKey="providers"
  service={providerService}
  {dependencies}
/>