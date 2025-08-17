<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { AdminFieldConfig } from '@features/admin/types';

  type T = $$Generic<Record<string, any>>;

  export let field: AdminFieldConfig<T>;
  export let value: string | number = '';
  export let error: string = '';
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher<{
    change: { fieldId: string; value: string | number };
    blur: { fieldId: string; value: string | number };
  }>();

  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedValue = target.value;
    
    // Convert to number if the original option value was a number
    const option = field.options?.find(opt => opt.value.toString() === selectedValue);
    value = option ? option.value : selectedValue;
    
    dispatch('change', { fieldId: field.id as string, value });
  }

  function handleBlur(event: Event) {
    dispatch('blur', { fieldId: field.id as string, value });
  }

  $: displayValue = value?.toString() || '';
</script>

<div class="admin-field">
  <label class="admin-field__label" for={field.id as string}>
    {field.title}
    {#if field.validation?.required}
      <span class="admin-field__required">*</span>
    {/if}
  </label>
  
  <select
    id={field.id as string}
    class="admin-field__select"
    class:admin-field__select--error={error}
    value={displayValue}
    {disabled}
    required={field.validation?.required}
    on:change={handleChange}
    on:blur={handleBlur}
  >
    {#if !field.validation?.required}
      <option value="">-- Select {field.title} --</option>
    {/if}
    
    {#if field.options}
      {#each field.options as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    {/if}
  </select>
  
  {#if field.helpText}
    <div class="admin-field__help">{field.helpText}</div>
  {/if}
  
  {#if error}
    <div class="admin-field__error">{error}</div>
  {/if}
</div>

<style lang="scss">
  .admin-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    
    &__label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text);
    }
    
    &__required {
      color: var(--color-error);
    }
    
    &__select {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: 0.375rem;
      font-size: 0.875rem;
      background-color: var(--color-bg);
      transition: border-color 0.2s;
      
      &:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px var(--color-primary-alpha);
      }
      
      &--error {
        border-color: var(--color-error);
        
        &:focus {
          border-color: var(--color-error);
          box-shadow: 0 0 0 3px var(--color-error-alpha);
        }
      }
      
      &:disabled {
        background-color: var(--color-bg-muted);
        cursor: not-allowed;
      }
    }
    
    &__help {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }
    
    &__error {
      font-size: 0.75rem;
      color: var(--color-error);
    }
  }
</style>