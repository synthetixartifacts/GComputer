<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import Modal from '@components/Modal.svelte';
  import AdminTextField from './fields/AdminTextField.svelte';
  import AdminNumberField from './fields/AdminNumberField.svelte';
  import AdminSelectField from './fields/AdminSelectField.svelte';
  import AdminTextareaField from './fields/AdminTextareaField.svelte';
  import AdminBooleanField from './fields/AdminBooleanField.svelte';
  import type { AdminFieldConfig, FormMode } from '@features/admin/types';
  import { t } from '@ts/i18n';

  type T = $$Generic<Record<string, any>>;

  export let open: boolean = false;
  export let mode: FormMode = 'create';
  export let fields: AdminFieldConfig<T>[] = [];
  export let entityName: string;
  export let singularName: string;
  export let data: Partial<T> = {};
  export let loading: boolean = false;

  const dispatch = createEventDispatcher<{
    close: void;
    submit: { data: Partial<T>; mode: FormMode };
  }>();

  let formData: Record<string, any> = {};
  let errors: Record<string, string> = {};
  let isSubmitting = false;

  // Initialize form data when modal opens or data changes
  $: if (open) {
    initializeForm();
  }

  function initializeForm() {
    formData = {};
    errors = {};
    
    fields.forEach(field => {
      if (field.showInForm !== false) {
        const fieldKey = field.id as string;
        if (mode === 'create') {
          formData[fieldKey] = field.defaultValue ?? getDefaultValueForType(field.type);
        } else {
          formData[fieldKey] = data[fieldKey] ?? field.defaultValue ?? getDefaultValueForType(field.type);
        }
      }
    });
  }

  function getDefaultValueForType(type?: string): any {
    switch (type) {
      case 'number': return null;
      case 'boolean': return false;
      case 'text':
      case 'email':
      case 'url':
      case 'textarea': return '';
      case 'select': return '';
      default: return '';
    }
  }

  function validateField(field: AdminFieldConfig<T>, value: any): string {
    if (!field.validation) return '';

    // Required validation
    if (field.validation.required) {
      if (value === null || value === undefined || value === '') {
        return `${field.title} is required`;
      }
    }

    // Min/Max validation for numbers
    if (field.type === 'number' && value !== null && value !== undefined && value !== '') {
      if (field.validation.min !== undefined && value < field.validation.min) {
        return `${field.title} must be at least ${field.validation.min}`;
      }
      if (field.validation.max !== undefined && value > field.validation.max) {
        return `${field.title} must be at most ${field.validation.max}`;
      }
    }

    // Min/Max length validation for strings
    if ((field.type === 'text' || field.type === 'textarea' || field.type === 'email' || field.type === 'url') && typeof value === 'string') {
      if (field.validation.min !== undefined && value.length < field.validation.min) {
        return `${field.title} must be at least ${field.validation.min} characters`;
      }
      if (field.validation.max !== undefined && value.length > field.validation.max) {
        return `${field.title} must be at most ${field.validation.max} characters`;
      }
    }

    // Pattern validation
    if (field.validation.pattern && typeof value === 'string' && value !== '') {
      if (!field.validation.pattern.test(value)) {
        return `${field.title} format is invalid`;
      }
    }

    // Custom validation
    if (field.validation.custom) {
      const customError = field.validation.custom(value);
      if (customError) return customError;
    }

    return '';
  }

  function handleFieldChange(event: CustomEvent<{ fieldId: string; value: any }>) {
    const { fieldId, value } = event.detail;
    formData[fieldId] = value;
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      errors[fieldId] = '';
    }
  }

  function handleFieldBlur(event: CustomEvent<{ fieldId: string; value: any }>) {
    const { fieldId, value } = event.detail;
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      errors[fieldId] = validateField(field, value);
    }
  }

  function validateForm(): boolean {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      if (field.showInForm !== false && !field.readonly) {
        const fieldKey = field.id as string;
        const error = validateField(field, formData[fieldKey]);
        if (error) {
          newErrors[fieldKey] = error;
          isValid = false;
        }
      }
    });

    errors = newErrors;
    return isValid;
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    
    if (!validateForm()) {
      return;
    }

    isSubmitting = true;
    
    try {
      // Only include form fields in the submission, exclude readonly and non-form fields
      const submissionData: Partial<T> = {};
      fields.forEach(field => {
        if (field.showInForm !== false && !field.readonly) {
          const fieldKey = field.id as string;
          submissionData[fieldKey as keyof T] = formData[fieldKey];
        }
      });

      dispatch('submit', { data: submissionData, mode });
    } finally {
      isSubmitting = false;
    }
  }

  function handleClose() {
    if (!isSubmitting) {
      dispatch('close');
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSubmit();
    }
  }

  // Filter fields that should be shown in form
  $: formFields = fields.filter(field => field.showInForm !== false);

  // Modal title
  $: modalTitle = mode === 'create' 
    ? `Create ${singularName}` 
    : mode === 'edit' 
      ? `Edit ${singularName}` 
      : `View ${singularName}`;
</script>

<Modal {open} onClose={handleClose} title="modal.{modalTitle.toLowerCase().replace(' ', '.')}">
  <form class="admin-form" on:submit|preventDefault={handleSubmit} on:keydown={handleKeyDown}>
    <div class="admin-form__fields">
      {#each formFields as field (field.id)}
        <div class="admin-form__field">
          {#if field.type === 'number'}
            <AdminNumberField
              {field}
              value={formData[field.id]}
              error={errors[field.id] || ''}
              disabled={isSubmitting || loading || field.readonly || mode === 'view'}
              on:change={handleFieldChange}
              on:blur={handleFieldBlur}
            />
          {:else if field.type === 'select'}
            <AdminSelectField
              {field}
              value={formData[field.id]}
              error={errors[field.id] || ''}
              disabled={isSubmitting || loading || field.readonly || mode === 'view'}
              on:change={handleFieldChange}
              on:blur={handleFieldBlur}
            />
          {:else if field.type === 'textarea'}
            <AdminTextareaField
              {field}
              value={formData[field.id]}
              error={errors[field.id] || ''}
              disabled={isSubmitting || loading || field.readonly || mode === 'view'}
              on:change={handleFieldChange}
              on:blur={handleFieldBlur}
            />
          {:else if field.type === 'boolean'}
            <AdminBooleanField
              {field}
              value={formData[field.id]}
              error={errors[field.id] || ''}
              disabled={isSubmitting || loading || field.readonly || mode === 'view'}
              on:change={handleFieldChange}
              on:blur={handleFieldBlur}
            />
          {:else}
            <AdminTextField
              {field}
              value={formData[field.id]}
              error={errors[field.id] || ''}
              disabled={isSubmitting || loading || field.readonly || mode === 'view'}
              on:change={handleFieldChange}
              on:blur={handleFieldBlur}
            />
          {/if}
        </div>
      {/each}
    </div>

    <div class="admin-form__actions">
      <button
        type="button"
        class="btn btn--secondary"
        disabled={isSubmitting}
        on:click={handleClose}
      >
        {mode === 'view' ? 'Close' : 'Cancel'}
      </button>
      
      {#if mode !== 'view'}
        <button
          type="submit"
          class="btn btn--primary"
          disabled={isSubmitting || loading}
        >
          {#if isSubmitting}
            <span class="loader loader--sm"></span>
          {/if}
          {mode === 'create' ? 'Create' : 'Save Changes'}
        </button>
      {/if}
    </div>
  </form>
</Modal>