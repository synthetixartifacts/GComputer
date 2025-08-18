<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Modal from '@components/Modal.svelte';
  import AdminTextField from './fields/AdminTextField.svelte';
  import type { TestRow, TestInsert, TestUpdate } from '@features/db/types';
  import { t } from '@ts/i18n';

  export let open: boolean = false;
  export let mode: 'create' | 'edit' | 'view' = 'create';
  export let data: Partial<TestRow> = {};
  export let loading: boolean = false;

  const dispatch = createEventDispatcher<{
    close: void;
    submit: { data: Partial<TestRow>; mode: 'create' | 'edit' | 'view' };
  }>();

  let formData: { column1: string; column2: string } = { column1: '', column2: '' };
  let errors: Record<string, string> = {};

  // Initialize form data when modal opens or data changes
  $: if (open) {
    initializeForm();
  }

  function initializeForm() {
    errors = {};
    
    if (mode === 'create') {
      formData = { column1: '', column2: '' };
    } else {
      formData = {
        column1: data.column1 || '',
        column2: data.column2 || ''
      };
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.column1?.trim()) {
      newErrors.column1 = 'Column 1 is required';
    }

    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  function handleFieldChange(event: CustomEvent<{ fieldId: string; value: string }>) {
    const { fieldId, value } = event.detail;
    (formData as any)[fieldId] = value;
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      errors[fieldId] = '';
    }
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    const submissionData: Partial<TestRow> = {
      column1: formData.column1 || null,
      column2: formData.column2 || null
    };

    dispatch('submit', { data: submissionData, mode });
  }

  function handleClose() {
    dispatch('close');
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSubmit();
    }
  }

  // Modal title
  $: modalTitle = mode === 'create' 
    ? 'Create Test Row' 
    : mode === 'edit' 
      ? 'Edit Test Row' 
      : 'View Test Row';

  // Fields configuration
  const fields = [
    {
      id: 'column1',
      title: 'Column 1',
      type: 'text' as const,
      validation: { required: true },
      placeholder: 'Enter value for column 1'
    },
    {
      id: 'column2', 
      title: 'Column 2',
      type: 'text' as const,
      placeholder: 'Enter value for column 2'
    }
  ];
</script>

<Modal {open} onClose={handleClose} title="modal.{modalTitle.toLowerCase().replace(' ', '.')}">
  <form class="admin-form" on:submit|preventDefault={handleSubmit} on:keydown={handleKeyDown}>
    <div class="admin-form__fields">
      {#each fields as field (field.id)}
        <div class="admin-form__field">
          <AdminTextField
            {field}
            value={(formData as any)[field.id]}
            error={errors[field.id] || ''}
            disabled={loading || mode === 'view'}
            on:change={handleFieldChange}
          />
        </div>
      {/each}
    </div>

    <div class="admin-form__actions">
      <button
        type="button"
        class="btn btn--secondary"
        disabled={loading}
        on:click={handleClose}
      >
        {mode === 'view' ? 'Close' : 'Cancel'}
      </button>
      
      {#if mode !== 'view'}
        <button
          type="submit"
          class="btn btn--primary"
          disabled={loading}
        >
          {#if loading}
            <span class="loader loader--sm"></span>
          {/if}
          {mode === 'create' ? 'Create' : 'Save Changes'}
        </button>
      {/if}
    </div>
  </form>
</Modal>