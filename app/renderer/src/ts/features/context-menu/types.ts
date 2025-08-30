/**
 * Context Menu Feature Types
 * Type definitions for the context menu feature
 */

export interface ContextMenuConfig {
  enabled: boolean;
  shortcut: string;
  actions: string[];
}

export interface ContextMenuAction {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
  requiresText?: boolean;
  category?: 'text' | 'ai' | 'clipboard' | 'system' | 'utility' | 'custom';
  shortcut?: string;
  description?: string;
}

export interface ContextMenuState {
  config: ContextMenuConfig;
  availableActions: ContextMenuAction[];
  loading: boolean;
  error: string | null;
}

export interface ActionExecutionResult {
  success: boolean;
  actionId: string;
  result?: string;
  error?: string;
}

export const DEFAULT_ACTIONS: ContextMenuAction[] = [
  {
    id: 'translate',
    label: 'contextMenu.actions.translate',
    icon: '🌐',
    enabled: true,
    requiresText: true,
    category: 'ai',
    shortcut: 'T',
    description: 'Translate selected text'
  },
  {
    id: 'fix-grammar',
    label: 'contextMenu.actions.fixGrammar',
    icon: '✏️',
    enabled: true,
    requiresText: true,
    category: 'ai',
    shortcut: 'G',
    description: 'Fix grammar and spelling'
  },
  {
    id: 'summarize',
    label: 'contextMenu.actions.summarize',
    icon: '📝',
    enabled: true,
    requiresText: true,
    category: 'ai',
    shortcut: 'S',
    description: 'Summarize selected text'
  },
  {
    id: 'explain',
    label: 'contextMenu.actions.explain',
    icon: '💡',
    enabled: true,
    requiresText: true,
    category: 'ai',
    shortcut: 'E',
    description: 'Explain selected text'
  },
  {
    id: 'screenshot',
    label: 'contextMenu.actions.screenshot',
    icon: '📸',
    enabled: true,
    requiresText: false,
    category: 'utility',
    shortcut: 'P',
    description: 'Take a screenshot'
  },
  {
    id: 'copy',
    label: 'contextMenu.actions.copy',
    icon: '📋',
    enabled: true,
    requiresText: true,
    category: 'text',
    shortcut: 'C',
    description: 'Copy to clipboard'
  },
  {
    id: 'paste',
    label: 'contextMenu.actions.paste',
    icon: '📄',
    enabled: true,
    requiresText: false,
    category: 'text',
    shortcut: 'V',
    description: 'Paste from clipboard'
  }
];

export const ACTION_PROMPTS: Record<string, string> = {
  'translate': 'Translate the following text to English. If it\'s already in English, translate to French. Only provide the translation, no explanations:\n\n',
  'fix-grammar': 'Fix any grammar and spelling mistakes in the following text. Only provide the corrected text, no explanations:\n\n',
  'summarize': 'Provide a concise summary of the following text in 2-3 sentences:\n\n',
  'explain': 'Explain the following text in simple terms:\n\n'
};