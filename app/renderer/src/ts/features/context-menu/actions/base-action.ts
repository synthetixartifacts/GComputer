/**
 * Base Action Interface
 * Common interface for all context menu actions
 */

import type { ActionContext, ActionExecutionResult } from '../types';

export interface BaseAction {
  id: string;
  name: string;
  description?: string;
  
  /**
   * Validate if the action can be executed in the current context
   */
  validate(context: ActionContext): boolean;
  
  /**
   * Execute the action
   */
  execute(context: ActionContext): Promise<ActionExecutionResult>;
  
  /**
   * Get UI configuration for the action
   */
  getUIConfig?(): {
    icon?: string;
    label?: string;
    requiresText?: boolean;
    category?: string;
    shortcut?: string;
  };
}

/**
 * Abstract base class for actions
 */
export abstract class AbstractAction implements BaseAction {
  abstract id: string;
  abstract name: string;
  description?: string;
  
  abstract validate(context: ActionContext): boolean;
  abstract execute(context: ActionContext): Promise<ActionExecutionResult>;
  
  getUIConfig() {
    return {};
  }
  
  /**
   * Helper to create a success result
   */
  protected success(result?: string): ActionExecutionResult {
    return {
      success: true,
      actionId: this.id,
      result
    };
  }
  
  /**
   * Helper to create an error result
   */
  protected error(error: string): ActionExecutionResult {
    return {
      success: false,
      actionId: this.id,
      error
    };
  }
}