<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { AdminFieldConfig } from '@features/admin/types';

  type T = $$Generic<Record<string, any>>;

  export let field: AdminFieldConfig<T>;
  export let value: number | null = null;
  export let error: string = '';
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher<{
    change: { fieldId: string; value: number | null };
    blur: { fieldId: string; value: number | null };
  }>();

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const numValue = target.value === '' ? null : parseFloat(target.value);
    value = isNaN(numValue as number) ? null : numValue;
    dispatch('change', { fieldId: field.id as string, value });
  }

  function handleBlur(event: Event) {
    const target = event.target as HTMLInputElement;
    const numValue = target.value === '' ? null : parseFloat(target.value);
    const finalValue = isNaN(numValue as number) ? null : numValue;
    dispatch('blur', { fieldId: field.id as string, value: finalValue });
  }

  $: displayValue = value === null ? '' : value.toString();
</script>

<div class="admin-field">
  <label class="admin-field__label" for={field.id as string}>
    {field.title}
    {#if field.validation?.required}
      <span class="admin-field__required">*</span>
    {/if}
  </label>
  
  <input
    id={field.id as string}
    class="admin-field__input"
    class:admin-field__input--error={error}
    type="number"
    value={displayValue}
    placeholder={field.placeholder || ''}
    readonly={field.readonly}
    {disabled}
    required={field.validation?.required}
    min={field.validation?.min}
    max={field.validation?.max}
    step="any"
    on:input={handleInput}
    on:blur={handleBlur}
  />
  
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
    
    &__input {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: 0.375rem;
      font-size: 0.875rem;
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
      
      &:disabled,
      &[readonly] {
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