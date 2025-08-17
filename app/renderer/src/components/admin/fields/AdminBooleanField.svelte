<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { AdminFieldConfig } from '@features/admin/types';

  type T = $$Generic<Record<string, any>>;

  export let field: AdminFieldConfig<T>;
  export let value: boolean = false;
  export let error: string = '';
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher<{
    change: { fieldId: string; value: boolean };
    blur: { fieldId: string; value: boolean };
  }>();

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    value = target.checked;
    dispatch('change', { fieldId: field.id as string, value });
  }

  function handleBlur(event: Event) {
    dispatch('blur', { fieldId: field.id as string, value });
  }
</script>

<div class="admin-field admin-field--boolean">
  <label class="admin-field__checkbox-label" for={field.id as string}>
    <input
      id={field.id as string}
      class="admin-field__checkbox"
      type="checkbox"
      checked={value}
      {disabled}
      on:change={handleChange}
      on:blur={handleBlur}
    />
    
    <span class="admin-field__checkbox-mark"></span>
    
    <span class="admin-field__checkbox-text">
      {field.title}
      {#if field.validation?.required}
        <span class="admin-field__required">*</span>
      {/if}
    </span>
  </label>
  
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
    
    &--boolean {
      gap: 0.5rem;
    }
    
    &__checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text);
    }
    
    &__checkbox {
      appearance: none;
      width: 1.125rem;
      height: 1.125rem;
      border: 2px solid var(--color-border);
      border-radius: 0.25rem;
      position: relative;
      cursor: pointer;
      transition: all 0.2s;
      
      &:checked {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
      }
      
      &:focus {
        outline: none;
        box-shadow: 0 0 0 3px var(--color-primary-alpha);
      }
      
      &:disabled {
        background-color: var(--color-bg-muted);
        border-color: var(--color-border-muted);
        cursor: not-allowed;
      }
    }
    
    &__checkbox-mark {
      position: absolute;
      left: 0;
      top: 0;
      width: 1.125rem;
      height: 1.125rem;
      pointer-events: none;
      
      &::after {
        content: '';
        position: absolute;
        left: 0.25rem;
        top: 0.125rem;
        width: 0.375rem;
        height: 0.625rem;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        opacity: 0;
        transition: opacity 0.2s;
      }
    }
    
    &__checkbox:checked + &__checkbox-mark::after {
      opacity: 1;
    }
    
    &__checkbox-text {
      flex: 1;
    }
    
    &__required {
      color: var(--color-error);
    }
    
    &__help {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-left: 1.625rem;
    }
    
    &__error {
      font-size: 0.75rem;
      color: var(--color-error);
      margin-left: 1.625rem;
    }
  }
</style>