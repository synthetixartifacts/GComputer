<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { 
    contextMenuStore, 
    enabledActions, 
    executeAction,
    hideMenu,
    showMenu
  } from '@features/context-menu';
  import { cleanup as cleanupViewManager } from '@features/context-menu/view-manager';
  import ViewContainer from '@components/context-menu/ViewContainer.svelte';
  import type { ContextMenuAction } from '@features/context-menu';
  
  let menuElement: HTMLDivElement;
  let selectedIndex = 0;
  let isLoading = false;
  
  $: actions = $enabledActions;
  $: selectedText = $contextMenuStore.selectedText;
  
  // Handle keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    // Check if we're in the main menu view
    if ($contextMenuStore.currentView !== 'menu') {
      // Only handle Escape in non-menu views
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
      }
      return;
    }
    
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
    console.log('[ContextMenuOverlay] Action clicked:', action.id, action);
    
    if (isLoading || action.enabled === false) {
      console.log('[ContextMenuOverlay] Action blocked - loading:', isLoading, 'enabled:', action.enabled);
      return;
    }
    
    isLoading = true;
    try {
      console.log('[ContextMenuOverlay] Executing action:', action.id);
      await executeAction(action.id);
    } finally {
      isLoading = false;
    }
  }
  
  function handleIndexChange(index: number) {
    selectedIndex = index;
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
    
    // Listen for selected text from main process
    if (window.gc?.context?.on) {
      window.gc.context.on('context-menu:set-selected-text', (text: string) => {
        console.log('[ContextMenuOverlay] Received selected text:', text);
        showMenu(text);
      });
    }
    
    // Try to get selected text on mount
    (async () => {
      if (window.gc?.context?.getSelected) {
        const result = await window.gc.context.getSelected();
        if (result.success && result.text) {
          console.log('[ContextMenuOverlay] Got selected text on mount:', result.text);
          showMenu(result.text);
        }
      }
    })();
  });
  
  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown);
    cleanupViewManager();
  });
</script>

<div 
  bind:this={menuElement}
  class="context-menu-overlay"
  tabindex="-1"
>
  <ViewContainer 
    {actions}
    {selectedText}
    {selectedIndex}
    onActionClick={handleActionClick}
    onIndexChange={handleIndexChange}
  />
</div>