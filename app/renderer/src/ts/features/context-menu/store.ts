/**
 * Context Menu Store
 * State management for the context menu feature
 */

import { writable, derived, get } from 'svelte/store';
import type { ContextMenuState, ContextMenuAction, ActionExecutionResult } from './types';
import { defaultActions } from './actions';
import { contextMenuService } from './service';

// Initial state
const initialState: ContextMenuState = {
  isVisible: false,
  position: null,
  selectedText: '',
  activeAction: null,
  isLoading: false,
  error: null
};

// Create the main store
function createContextMenuStore() {
  const { subscribe, set, update } = writable<ContextMenuState>(initialState);

  return {
    subscribe,
    
    // Show the context menu
    show: async (position?: { x: number; y: number }) => {
      try {
        // Get selected text first
        const selectedText = await contextMenuService.getSelectedText();
        
        update(state => ({
          ...state,
          isVisible: true,
          position: position || null,
          selectedText,
          error: null
        }));
        
        // Show the actual menu window
        await contextMenuService.showMenu(position);
      } catch (error) {
        console.error('Error showing context menu:', error);
        update(state => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to show menu'
        }));
      }
    },
    
    // Hide the context menu
    hide: async () => {
      update(state => ({
        ...state,
        isVisible: false,
        activeAction: null,
        error: null
      }));
      
      try {
        await contextMenuService.hideMenu();
      } catch (error) {
        console.error('Error hiding context menu:', error);
      }
    },
    
    // Execute an action
    executeAction: async (actionId: string) => {
      const state = get(contextMenuStore);
      
      update(s => ({
        ...s,
        activeAction: actionId,
        isLoading: true,
        error: null
      }));
      
      try {
        const result = await contextMenuService.executeAction(
          actionId,
          state.selectedText
        );
        
        if (result.success) {
          // Store the result for display
          actionResults.set(result);
          
          // Hide menu after successful action
          await contextMenuStore.hide();
        } else {
          update(s => ({
            ...s,
            isLoading: false,
            error: result.error || 'Action failed'
          }));
        }
      } catch (error) {
        update(s => ({
          ...s,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    },
    
    // Set selected text manually
    setSelectedText: (text: string) => {
      update(state => ({
        ...state,
        selectedText: text
      }));
    },
    
    // Clear error
    clearError: () => {
      update(state => ({
        ...state,
        error: null
      }));
    },
    
    // Reset state
    reset: () => {
      set(initialState);
    }
  };
}

// Create the store instance
export const contextMenuStore = createContextMenuStore();

// Store for available actions
export const contextMenuActions = writable<ContextMenuAction[]>(defaultActions);

// Store for action results
export const actionResults = writable<ActionExecutionResult | null>(null);

// Derived store for enabled actions based on selected text
export const enabledActions = derived(
  [contextMenuStore, contextMenuActions],
  ([$contextMenu, $actions]) => {
    const hasText = $contextMenu.selectedText.length > 0;
    
    return $actions.map(action => ({
      ...action,
      enabled: action.requiresText ? hasText : true
    }));
  }
);

// Derived store for grouped actions by category
export const groupedActions = derived(
  enabledActions,
  ($actions) => {
    const groups: Record<string, ContextMenuAction[]> = {};
    
    $actions.forEach(action => {
      const category = action.category || 'custom';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(action);
    });
    
    return groups;
  }
);

// Helper function to clear action results
export function clearActionResults(): void {
  actionResults.set(null);
}