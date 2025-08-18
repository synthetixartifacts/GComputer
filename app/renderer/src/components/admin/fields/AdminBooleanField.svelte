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