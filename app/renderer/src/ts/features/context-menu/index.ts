/**
 * Context Menu Feature
 * Public API exports
 */

// Export types
export type {
  ContextMenuConfig,
  ContextMenuAction,
  ContextMenuState,
  ActionExecutionResult
} from './types';

export { DEFAULT_ACTIONS, ACTION_PROMPTS } from './types';

// Export service functions
export {
  getContextMenuConfig,
  updateContextMenuConfig,
  getAvailableActions,
  getEnabledActions,
  executeContextMenuAction,
  actionRequiresText,
  getActionById,
  showContextMenu,
  hideContextMenu,
  getSelectedText
} from './service';

// Export store and store functions
export {
  contextMenuConfig,
  selectedText,
  contextMenuVisible,
  contextMenuLoading,
  contextMenuError,
  enabledActions,
  groupedActions,
  contextMenuStore,
  updateConfig,
  showMenu,
  hideMenu,
  setLoading,
  setError,
  executeAction
} from './store';