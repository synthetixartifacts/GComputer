<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { t } from '@ts/i18n/store';
  import type { ContextMenuAction } from '@features/context-menu';
  
  interface Props {
    action: ContextMenuAction;
    isSelected?: boolean;
    isDisabled?: boolean;
    isLoading?: boolean;
  }
  
  let { 
    action, 
    isSelected = false, 
    isDisabled = false,
    isLoading = false 
  } = $props<Props>();
  
  const dispatch = createEventDispatcher<{
    click: ContextMenuAction;
    mouseenter: ContextMenuAction;
  }>();
  
  function handleClick() {
    if (!isDisabled && !isLoading) {
      dispatch('click', action);
    }
  }
  
  function handleMouseEnter() {
    if (!isDisabled) {
      dispatch('mouseenter', action);
    }
  }
</script>

<button
  class="action-item"
  class:selected={isSelected}
  class:disabled={isDisabled}
  class:loading={isLoading}
  disabled={isDisabled || isLoading}
  on:click={handleClick}
  on:mouseenter={handleMouseEnter}
  title="{action.description || $t(action.label)} {action.shortcut ? `(${action.shortcut})` : ''}"
>
  <span class="icon">
    {#if isLoading}
      <span class="spinner">⟳</span>
    {:else}
      {action.icon}
    {/if}
  </span>
  
  <span class="label">
    {$t(action.label)}
  </span>
  
  {#if action.shortcut && !isLoading}
    <span class="shortcut">{action.shortcut}</span>
  {/if}
</button>