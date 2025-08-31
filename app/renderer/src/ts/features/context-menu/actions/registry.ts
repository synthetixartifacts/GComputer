/**
 * Action Registry
 * Central registry for all context menu actions
 */

import type { BaseAction } from './base-action';
import { translateAction } from './translate';

// Registry of all available actions
const actionRegistry = new Map<string, BaseAction>();

/**
 * Register an action
 */
export function registerAction(action: BaseAction): void {
  actionRegistry.set(action.id, action);
}

/**
 * Get an action by ID
 */
export function getAction(id: string): BaseAction | undefined {
  return actionRegistry.get(id);
}

/**
 * Get all registered actions
 */
export function getAllActions(): BaseAction[] {
  return Array.from(actionRegistry.values());
}

/**
 * Check if an action is registered
 */
export function hasAction(id: string): boolean {
  return actionRegistry.has(id);
}

/**
 * Initialize default actions
 */
export function initializeActions(): void {
  // Register translate action
  registerAction(translateAction);
  
  // Future actions can be registered here
  // registerAction(summarizeAction);
  // registerAction(explainAction);
  // etc.
}

// Initialize on module load
initializeActions();