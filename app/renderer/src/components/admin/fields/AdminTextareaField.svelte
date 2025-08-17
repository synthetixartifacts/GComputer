<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { AdminFieldConfig } from '@features/admin/types';

  type T = $$Generic<Record<string, any>>;

  export let field: AdminFieldConfig<T>;
  export let value: string = '';
  export let error: string = '';
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher<{
    change: { fieldId: string; value: string };
    blur: { fieldId: string; value: string };
  }>();

  function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    value = target.value;
    dispatch('change', { fieldId: field.id as string, value });
  }

  function handleBlur(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    dispatch('blur', { fieldId: field.id as string, value: target.value });
  }
</script>

<div class="admin-field">
  <label class="admin-field__label" for={field.id as string}>
    {field.title}
    {#if field.validation?.required}
      <span class="admin-field__required">*</span>
    {/if}
  </label>
  
  <textarea
    id={field.id as string}
    class="admin-field__textarea"
    class:admin-field__textarea--error={error}
    {value}
    placeholder={field.placeholder || ''}
    readonly={field.readonly}
    {disabled}
    required={field.validation?.required}
    minlength={field.validation?.min}
    maxlength={field.validation?.max}
    rows="4"
    on:input={handleInput}
    on:blur={handleBlur}
  ></textarea>
  
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
    
    &__textarea {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-family: inherit;
      resize: vertical;
      transition: border-color 0.2s;
      min-height: 100px;
      
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