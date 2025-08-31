/**
 * Context Menu Actions
 * Defines all available actions for the context menu
 */

import type { ContextMenuAction } from './types';

/**
 * Default context menu actions
 */
export const defaultActions: ContextMenuAction[] = [
  {
    id: 'translate',
    label: 'contextMenu.actions.translate',
    icon: '🌐',
    shortcut: 'T',
    description: 'Translate selected text',
    requiresText: true,
    category: 'ai'
  },
  {
    id: 'fix-grammar',
    label: 'contextMenu.actions.fixGrammar',
    icon: '✏️',
    shortcut: 'G',
    description: 'Fix grammar and spelling',
    requiresText: true,
    category: 'ai'
  },
  {
    id: 'summarize',
    label: 'contextMenu.actions.summarize',
    icon: '📝',
    shortcut: 'S',
    description: 'Summarize selected text',
    requiresText: true,
    category: 'ai'
  },
  {
    id: 'explain',
    label: 'contextMenu.actions.explain',
    icon: '💡',
    shortcut: 'E',
    description: 'Explain selected text',
    requiresText: true,
    category: 'ai'
  },
  {
    id: 'screenshot',
    label: 'contextMenu.actions.screenshot',
    icon: '📸',
    shortcut: 'P',
    description: 'Take a screenshot',
    requiresText: false,
    category: 'utility'
  },
  {
    id: 'copy',
    label: 'contextMenu.actions.copy',
    icon: '📋',
    shortcut: 'C',
    description: 'Copy to clipboard',
    requiresText: true,
    category: 'text'
  },
  {
    id: 'paste',
    label: 'contextMenu.actions.paste',
    icon: '📄',
    shortcut: 'V',
    description: 'Paste from clipboard',
    requiresText: false,
    category: 'text'
  }
];

/**
 * AI prompt templates for different actions
 */
export const actionPrompts: Record<string, string> = {
  'translate': 'Translate the following text to English. If it\'s already in English, translate to French. Only provide the translation, no explanations:\n\n',
  'fix-grammar': 'Fix any grammar and spelling mistakes in the following text. Only provide the corrected text, no explanations:\n\n',
  'summarize': 'Provide a concise summary of the following text in 2-3 sentences:\n\n',
  'explain': 'Explain the following text in simple terms:\n\n'
};

/**
 * Get action by ID
 */
export function getActionById(id: string): ContextMenuAction | undefined {
  return defaultActions.find(action => action.id === id);
}

/**
 * Get actions by category
 */
export function getActionsByCategory(category: string): ContextMenuAction[] {
  return defaultActions.filter(action => action.category === category);
}

/**
 * Check if action requires text
 */
export function actionRequiresText(actionId: string): boolean {
  const action = getActionById(actionId);
  return action?.requiresText ?? false;
}

/**
 * Get AI actions
 */
export function getAIActions(): ContextMenuAction[] {
  return getActionsByCategory('ai');
}

/**
 * Validate action can be executed
 */
export function canExecuteAction(actionId: string, hasText: boolean): boolean {
  const action = getActionById(actionId);
  if (!action) return false;
  
  if (action.enabled === false) return false;
  
  if (action.requiresText && !hasText) return false;
  
  return true;
}