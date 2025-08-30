/**
 * Context Menu Store
 * State management for context menu feature
 */

import { writable, derived } from 'svelte/store';
import type { ContextMenuConfig, ContextMenuAction, ContextMenuState } from './types';
import { DEFAULT_ACTIONS } from './types';

/**
 * Context menu configuration store
 */
export const contextMenuConfig = writable<ContextMenuConfig>({
  enabled: false,
  shortcut: 'Alt+Space',
  actions: DEFAULT_ACTIONS.map(a => a.id)
});

/**
 * Selected text store
 */
export const selectedText = writable<string>('');

/**
 * Context menu visibility store
 */
export const contextMenuVisible = writable<boolean>(false);

/**
 * Loading state store
 */
export const contextMenuLoading = writable<boolean>(false);

/**
 * Error state store
 */
export const contextMenuError = writable<string | null>(null);

/**
 * Derived store for enabled actions based on configuration
 */
export const enabledActions = derived(
  contextMenuConfig,
  ($config) => {
    return DEFAULT_ACTIONS.filter(action => 
      $config.actions.includes(action.id)
    );
  }
);

/**
 * Derived store for grouped actions by category
 */
export const groupedActions = derived(
  enabledActions,
  ($actions) => {
    const groups: Record<string, ContextMenuAction[]> = {};
    
    $actions.forEach(action => {
      const category = action.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(action);
    });
    
    return groups;
  }
);

/**
 * Combined state store
 */
export const contextMenuStore = derived(
  [contextMenuConfig, selectedText, contextMenuVisible, contextMenuLoading, contextMenuError, enabledActions],
  ([$config, $selectedText, $visible, $loading, $error, $enabledActions]) => ({
    config: $config,
    selectedText: $selectedText,
    isVisible: $visible,
    loading: $loading,
    error: $error,
    enabledActions: $enabledActions,
    hasText: $selectedText.length > 0
  })
);

/**
 * Update configuration
 */
export function updateConfig(config: Partial<ContextMenuConfig>): void {
  contextMenuConfig.update(current => ({
    ...current,
    ...config
  }));
}

/**
 * Show context menu
 */
export function showMenu(text: string = ''): void {
  selectedText.set(text);
  contextMenuVisible.set(true);
  contextMenuError.set(null);
}

/**
 * Hide context menu
 */
export function hideMenu(): void {
  contextMenuVisible.set(false);
  selectedText.set('');
  contextMenuError.set(null);
}

/**
 * Set loading state
 */
export function setLoading(loading: boolean): void {
  contextMenuLoading.set(loading);
}

/**
 * Set error state
 */
export function setError(error: string | null): void {
  contextMenuError.set(error);
}

/**
 * Execute action from store
 */
export async function executeAction(actionId: string): Promise<void> {
  const { executeContextMenuAction } = await import('./service');
  const text = await new Promise<string>(resolve => {
    selectedText.subscribe(value => resolve(value))();
  });
  
  setLoading(true);
  setError(null);
  
  try {
    const result = await executeContextMenuAction(actionId, text);
    
    if (!result.success) {
      setError(result.error || 'Action failed');
    } else {
      // Action succeeded - menu will be hidden by the service
      hideMenu();
    }
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Unknown error');
  } finally {
    setLoading(false);
  }
}