/**
 * Context Menu Feature Module
 * Public API exports for the context menu feature
 */

// Types
export type {
  ContextMenuAction,
  ContextMenuPosition,
  ContextMenuState,
  ActionExecutionResult,
  AIActionOptions,
  ContextMenuConfig,
  ActionHandler,
  ActionHandlerMap,
  ContextMenuEvent
} from './types';

// Actions
export {
  defaultActions,
  actionPrompts,
  getActionById,
  getActionsByCategory,
  actionRequiresText,
  getAIActions,
  canExecuteAction
} from './actions';

// Service
export { contextMenuService } from './service';

// Store
export {
  contextMenuStore,
  contextMenuActions,
  actionResults,
  enabledActions,
  groupedActions,
  clearActionResults
} from './store';