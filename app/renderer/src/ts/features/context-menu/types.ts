/**
 * Context Menu Types
 * Type definitions for the context menu feature
 */

export interface ContextMenuAction {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  description?: string;
  enabled?: boolean;
  requiresText?: boolean;
  category?: ActionCategory;
  handler?: ActionHandler;
  metadata?: Record<string, unknown>;
}

export type ActionCategory = 'text' | 'ai' | 'clipboard' | 'system' | 'utility' | 'custom';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ContextMenuState {
  isVisible: boolean;
  position: ContextMenuPosition | null;
  selectedText: string;
  activeAction: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface ActionExecutionResult {
  success: boolean;
  actionId: string;
  result?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AIActionOptions {
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface ContextMenuConfig {
  shortcuts: {
    primary: string;
    secondary?: string;
  };
  actions: ContextMenuAction[];
  theme?: 'light' | 'dark' | 'auto';
  position?: 'cursor' | 'center' | 'custom';
  autoHide?: boolean;
  animationDuration?: number;
}

export type ActionHandler = (text: string, options?: AIActionOptions) => Promise<ActionExecutionResult>;

export interface ActionHandlerMap {
  [actionId: string]: ActionHandler;
}

export interface ContextMenuEvent {
  type: 'show' | 'hide' | 'action' | 'error';
  data?: any;
  timestamp: number;
}