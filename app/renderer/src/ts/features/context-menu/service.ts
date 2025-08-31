/**
 * Context Menu Service
 * Business logic for context menu operations
 */

import type { ContextMenuConfig, ContextMenuAction, ActionExecutionResult } from './types';
import { DEFAULT_ACTIONS, ACTION_PROMPTS } from './types';
import { isElectronEnvironment } from '../environment/service';

/**
 * Get context menu configuration from database
 */
export async function getContextMenuConfig(): Promise<ContextMenuConfig | null> {
  if (!isElectronEnvironment() || !window.gc?.context) {
    return {
      enabled: false,
      shortcut: 'Alt+Space',
      actions: DEFAULT_ACTIONS.map(a => a.id)
    };
  }
  
  try {
    const result = await window.gc.context.getConfig();
    if (result.success && result.config) {
      return result.config;
    }
    return null;
  } catch (error) {
    console.error('Failed to get context menu config:', error);
    return null;
  }
}

/**
 * Update context menu configuration in database
 */
export async function updateContextMenuConfig(config: Partial<ContextMenuConfig>): Promise<boolean> {
  if (!isElectronEnvironment() || !window.gc?.context) {
    console.warn('Context menu API not available');
    return false;
  }
  
  try {
    const result = await window.gc.context.updateConfig(config);
    return result.success;
  } catch (error) {
    console.error('Failed to update context menu config:', error);
    return false;
  }
}

/**
 * Get available context menu actions
 */
export function getAvailableActions(): ContextMenuAction[] {
  return DEFAULT_ACTIONS;
}

/**
 * Get enabled actions based on configuration
 */
export function getEnabledActions(config: ContextMenuConfig): ContextMenuAction[] {
  return DEFAULT_ACTIONS.filter(action => 
    config.actions.includes(action.id)
  );
}

/**
 * Execute a context menu action using the action registry
 * This is scalable - actions are registered in the registry and can be added dynamically
 */
export async function executeContextMenuAction(
  actionId: string, 
  text: string
): Promise<ActionExecutionResult> {
  // Import action registry dynamically to avoid circular dependencies
  const { getAction } = await import('./actions/registry');
  
  const action = getAction(actionId);
  
  if (!action) {
    console.error(`Action not found in registry: ${actionId}`);
    return {
      success: false,
      actionId,
      error: `Unknown action: ${actionId}`
    };
  }
  
  try {
    // Create action context
    const context = {
      selectedText: text,
      hasSelection: text.length > 0
    };
    
    // Validate action can be executed
    if (!action.validate(context)) {
      return {
        success: false,
        actionId,
        error: 'Action validation failed'
      };
    }
    
    // Execute the action
    const result = await action.execute(context);
    
    return result;
  } catch (error) {
    console.error('Failed to execute context menu action:', error);
    return {
      success: false,
      actionId,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if an action requires text selection
 */
export function actionRequiresText(actionId: string): boolean {
  const action = DEFAULT_ACTIONS.find(a => a.id === actionId);
  return action?.requiresText ?? false;
}

/**
 * Get action by ID
 */
export function getActionById(actionId: string): ContextMenuAction | undefined {
  return DEFAULT_ACTIONS.find(a => a.id === actionId);
}

/**
 * Show context menu
 */
export async function showContextMenu(position?: { x: number; y: number }): Promise<boolean> {
  if (!isElectronEnvironment() || !window.gc?.context) {
    return false;
  }
  
  try {
    const result = await window.gc.context.showMenu(position);
    return result.success;
  } catch (error) {
    console.error('Failed to show context menu:', error);
    return false;
  }
}

/**
 * Hide context menu
 */
export async function hideContextMenu(): Promise<boolean> {
  if (!isElectronEnvironment() || !window.gc?.context) {
    return false;
  }
  
  try {
    const result = await window.gc.context.hideMenu();
    return result.success;
  } catch (error) {
    console.error('Failed to hide context menu:', error);
    return false;
  }
}

/**
 * Get selected text from active application
 */
export async function getSelectedText(): Promise<string> {
  if (!isElectronEnvironment() || !window.gc?.context) {
    return '';
  }
  
  try {
    const result = await window.gc.context.getSelected();
    return result.success ? result.text || '' : '';
  } catch (error) {
    console.error('Failed to get selected text:', error);
    return '';
  }
}