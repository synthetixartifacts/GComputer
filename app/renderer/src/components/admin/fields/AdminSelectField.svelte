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