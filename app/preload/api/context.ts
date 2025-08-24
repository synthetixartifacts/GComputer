/**
 * Context Menu Preload API
 * Secure bridge for context menu operations between renderer and main process
 */

import { ipcRenderer } from 'electron';

export interface ContextMenuResult {
  success: boolean;
  text?: string;
  timestamp?: number;
  error?: string;
}

export interface ActionResult {
  success: boolean;
  action?: string;
  text?: string;
  result?: string;
  error?: string;
}

export interface ShortcutResult {
  success: boolean;
  shortcuts?: {
    primary: string;
    secondary?: string;
  };
  error?: string;
}

/**
 * Context Menu API exposed to renderer process
 */
export const contextApi = {
  /**
   * Get selected text from the active application
   */
  getSelected: (): Promise<ContextMenuResult> => {
    return ipcRenderer.invoke('context:get-selected');
  },

  /**
   * Show the context menu overlay
   */
  showMenu: (position?: { x: number; y: number }): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('context:show-menu', position);
  },

  /**
   * Hide the context menu overlay
   */
  hideMenu: (): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('context:hide-menu');
  },

  /**
   * Execute a context menu action with the given text
   */
  executeAction: (action: string, text: string): Promise<ActionResult> => {
    return ipcRenderer.invoke('context:execute-action', action, text);
  },

  /**
   * Get text directly from clipboard
   */
  getClipboard: (): Promise<ContextMenuResult> => {
    return ipcRenderer.invoke('context:get-clipboard');
  },

  /**
   * Set text to clipboard
   */
  setClipboard: (text: string): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('context:set-clipboard', text);
  },

  /**
   * Get current shortcut configuration
   */
  getShortcuts: (): Promise<ShortcutResult> => {
    return ipcRenderer.invoke('context:get-shortcuts');
  },

  /**
   * Update shortcut configuration
   */
  updateShortcuts: (shortcuts: { primary?: string; secondary?: string }): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('context:update-shortcuts', shortcuts);
  },

  /**
   * Listen for context menu events from main process
   */
  on: (channel: string, callback: (data: any) => void) => {
    const validChannels = ['context-menu:show', 'context-menu:hide', 'context-menu:action-result'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, data) => callback(data));
    }
  },

  /**
   * Remove context menu event listener
   */
  off: (channel: string, callback: (data: any) => void) => {
    const validChannels = ['context-menu:show', 'context-menu:hide', 'context-menu:action-result'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  }
};