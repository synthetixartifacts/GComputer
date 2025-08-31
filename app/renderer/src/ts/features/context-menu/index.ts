/**
 * Context Menu Feature
 * Public API exports
 */

// Export types
export type {
  ContextMenuConfig,
  ContextMenuAction,
  ContextMenuState,
  ActionExecutionResult,
  ViewType,
  ViewState,
  AlertConfig,
  ActionContext,
  ActionModule
} from './types';

export { DEFAULT_ACTIONS, ACTION_PROMPTS, ALL_AVAILABLE_ACTIONS } from './types';

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

// Export view manager functions
export {
  viewState,
  navigateToView,
  goBack,
  resetToMenu,
  showAlert,
  showError,
  showSuccess,
  showWarning,
  showInfo,
  cleanup,
  canGoBack,
  getCurrentView,
  getViewData
} from './view-manager';

// Export action registry
export { 
  registerAction, 
  getAction, 
  getAllActions, 
  hasAction,
  initializeActions 
} from './actions/registry';

// Export base action classes
export type { BaseAction } from './actions/base-action';
export { AbstractAction } from './actions/base-action';