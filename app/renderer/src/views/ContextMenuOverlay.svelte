<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { t } from '@ts/i18n/store';
  import { 
    contextMenuStore, 
    enabledActions, 
    groupedActions,
    executeAction,
    hideMenu
  } from '@features/context-menu';
  import type { ContextMenuAction } from '@features/context-menu';
  
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
          handleActionClick(actions[selectedIndex]);
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
          handleActionClick(action);
        }
        break;
    }
  }
  
  async function handleActionClick(action: ContextMenuAction) {
    if (isLoading || action.enabled === false) return;
    
    isLoading = true;
    try {
      await executeAction(action.id);
    } finally {
      isLoading = false;
    }
  }
  
  function closeMenu() {
    hideMenu();
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
            <button
              class="action-item {actions.indexOf(action) === selectedIndex ? 'selected' : ''} {action.enabled === false || (action.requiresText && !hasText) ? 'disabled' : ''}"
              disabled={isLoading || action.enabled === false || (action.requiresText && !hasText)}
              on:click={() => handleActionClick(action)}
              on:mouseenter={() => selectedIndex = actions.indexOf(action)}
            >
              <span class="icon">{action.icon}</span>
              <span class="label">{$t(action.label)}</span>
              {#if action.shortcut}
                <span class="shortcut">{action.shortcut}</span>
              {/if}
            </button>
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