<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { t } from '@ts/i18n/store';
  import { contextMenuStore, enabledActions, groupedActions } from '@features/context-menu';
  import type { ContextMenuAction } from '@features/context-menu';
  import ActionItem from '@components/context-menu/ActionItem.svelte';
  
  let menuElement: HTMLDivElement;
  let selectedIndex = 0;
  let isLoading = false;
  
  $: actions = $enabledActions;
  $: groups = $groupedActions;
  $: selectedText = $contextMenuStore.selectedText;
  $: hasText = selectedText.length > 0;
  
  // Handle keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = Math.max(0, selectedIndex - 1);
        break;
      
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = Math.min(actions.length - 1, selectedIndex + 1);
        break;
      
      case 'Enter':
        event.preventDefault();
        if (actions[selectedIndex] && actions[selectedIndex].enabled !== false) {
          executeAction(actions[selectedIndex]);
        }
        break;
      
      case 'Escape':
        event.preventDefault();
        closeMenu();
        break;
      
      default:
        // Handle action shortcuts
        const action = actions.find(a => 
          a.shortcut?.toLowerCase() === event.key.toLowerCase() && 
          a.enabled !== false
        );
        if (action) {
          event.preventDefault();
          executeAction(action);
        }
        break;
    }
  }
  
  async function executeAction(action: ContextMenuAction) {
    if (isLoading || action.enabled === false) return;
    
    isLoading = true;
    try {
      await contextMenuStore.executeAction(action.id);
    } finally {
      isLoading = false;
    }
  }
  
  function closeMenu() {
    contextMenuStore.hide();
    // Close the window if we're in the overlay
    if (window.opener === null) {
      window.close();
    }
  }
  
  onMount(() => {
    // Focus the menu for keyboard navigation
    menuElement?.focus();
    
    // Add keyboard listener
    document.addEventListener('keydown', handleKeydown);
    
    // Auto-select first enabled action
    const firstEnabled = actions.findIndex(a => a.enabled !== false);
    if (firstEnabled !== -1) {
      selectedIndex = firstEnabled;
    }
  });
  
  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown);
  });
</script>

<div 
  bind:this={menuElement}
  class="context-menu-overlay"
  tabindex="-1"
>
  {#if hasText}
    <div class="selected-text">
      <span class="label">{$t('contextMenu.selectedText')}:</span>
      <span class="text">{selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}</span>
    </div>
  {/if}
  
  <div class="actions-container">
    {#each Object.entries(groups) as [category, categoryActions]}
      {#if categoryActions.length > 0}
        <div class="action-group">
          <div class="group-label">{$t(`contextMenu.categories.${category}`)}</div>
          {#each categoryActions as action, index}
            <ActionItem
              {action}
              isSelected={actions.indexOf(action) === selectedIndex}
              isDisabled={action.enabled === false}
              {isLoading}
              on:click={() => executeAction(action)}
              on:mouseenter={() => selectedIndex = actions.indexOf(action)}
            />
          {/each}
        </div>
      {/if}
    {/each}
  </div>
  
  {#if $contextMenuStore.error}
    <div class="error-message">
      {$contextMenuStore.error}
    </div>
  {/if}
  
  <div class="shortcuts-hint">
    <span>{$t('contextMenu.shortcuts.navigation')}</span>
    <span class="separator">•</span>
    <span>ESC {$t('contextMenu.shortcuts.close')}</span>
  </div>
</div>