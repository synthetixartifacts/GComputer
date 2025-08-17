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
    const target = event.target as HTMLInputElement;
    value = target.value;
    dispatch('change', { fieldId: field.id as string, value });
  }

  function handleBlur(event: Event) {
    const target = event.target as HTMLInputElement;
    dispatch('blur', { fieldId: field.id as string, value: target.value });
  }

  // Determine input type
  $: inputType = field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text';
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
    type={inputType}
    {value}
    placeholder={field.placeholder || ''}
    readonly={field.readonly}
    {disabled}
    required={field.validation?.required}
    minlength={field.validation?.min}
    maxlength={field.validation?.max}
    pattern={field.validation?.pattern?.source}
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