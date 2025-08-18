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