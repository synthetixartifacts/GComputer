/**
 * IPC Handlers for Context Menu
 * Registers all IPC communication handlers for the context menu feature
 */

import { ipcMain } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import { getWindowManager } from './window-manager';
import { getContextService } from './context-service';
import { getShortcutManager } from './shortcuts';
import { configurationService } from '../db/services/index';

export interface ContextMenuAction {
  id: string;
  text: string;
  metadata?: Record<string, any>;
}

/**
 * Register all context menu IPC handlers
 */
export function registerContextMenuIpc(): void {
  console.log('[context-menu] Registering IPC handlers');

  // Get selected text from the active application
  ipcMain.handle('context:get-selected', async (_event: IpcMainInvokeEvent) => {
    try {
      const contextService = getContextService();
      const contextData = await contextService.captureSelectedText();
      return {
        success: true,
        text: contextData.selectedText,
        timestamp: contextData.timestamp
      };
    } catch (error) {
      console.error('[context-menu] Error getting selected text:', error);
      return {
        success: false,
        text: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Show the context menu overlay
  ipcMain.handle('context:show-menu', async (_event: IpcMainInvokeEvent, position?: { x: number; y: number }) => {
    try {
      const windowManager = getWindowManager();
      await windowManager.show(position);
      return { success: true };
    } catch (error) {
      console.error('[context-menu] Error showing menu:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Hide the context menu overlay
  ipcMain.handle('context:hide-menu', async (_event: IpcMainInvokeEvent) => {
    try {
      const windowManager = getWindowManager();
      windowManager.hide();
      return { success: true };
    } catch (error) {
      console.error('[context-menu] Error hiding menu:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Execute a context menu action
  ipcMain.handle('context:execute-action', async (_event: IpcMainInvokeEvent, action: string, text: string) => {
    try {
      console.log(`[context-menu] Executing action: ${action} with text: ${text?.substring(0, 50)}...`);
      
      // Hide the menu after action selection
      const windowManager = getWindowManager();
      windowManager.hide();

      // Here we'll integrate with the AI service and other features
      // For now, return a placeholder response
      return {
        success: true,
        action,
        text,
        result: `Action "${action}" executed with text: "${text?.substring(0, 100)}..."`
      };
    } catch (error) {
      console.error('[context-menu] Error executing action:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Get clipboard text directly
  ipcMain.handle('context:get-clipboard', async (_event: IpcMainInvokeEvent) => {
    try {
      const contextService = getContextService();
      const text = contextService.getClipboardText();
      return {
        success: true,
        text
      };
    } catch (error) {
      console.error('[context-menu] Error getting clipboard:', error);
      return {
        success: false,
        text: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Set clipboard text
  ipcMain.handle('context:set-clipboard', async (_event: IpcMainInvokeEvent, text: string) => {
    try {
      const contextService = getContextService();
      contextService.setClipboardText(text);
      return { success: true };
    } catch (error) {
      console.error('[context-menu] Error setting clipboard:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Get shortcut configuration
  ipcMain.handle('context:get-shortcuts', async (_event: IpcMainInvokeEvent) => {
    try {
      const shortcutManager = getShortcutManager();
      const shortcuts = shortcutManager.getShortcuts();
      return {
        success: true,
        shortcuts
      };
    } catch (error) {
      console.error('[context-menu] Error getting shortcuts:', error);
      return {
        success: false,
        shortcuts: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Update shortcut configuration
  ipcMain.handle('context:update-shortcuts', async (_event: IpcMainInvokeEvent, shortcuts: any) => {
    try {
      const shortcutManager = getShortcutManager();
      const success = shortcutManager.updateShortcuts(shortcuts);
      return { success };
    } catch (error) {
      console.error('[context-menu] Error updating shortcuts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Get context menu configuration from database
  ipcMain.handle('context:get-config', async (_event: IpcMainInvokeEvent) => {
    try {
      const [enabledConfig, shortcutConfig, actionsConfig] = await Promise.all([
        configurationService.getByCode('context_menu_enabled'),
        configurationService.getByCode('context_menu_shortcut'),
        configurationService.getByCode('context_menu_actions')
      ]);

      return {
        success: true,
        config: {
          enabled: enabledConfig?.value === 'true',
          shortcut: shortcutConfig?.value || 'Alt+Space',
          actions: actionsConfig?.value ? JSON.parse(actionsConfig.value) : []
        }
      };
    } catch (error) {
      console.error('[context-menu] Error getting configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get configuration'
      };
    }
  });

  // Update context menu configuration in database
  ipcMain.handle('context:update-config', async (_event: IpcMainInvokeEvent, config: any) => {
    try {
      const updates = [];

      if (config.enabled !== undefined) {
        updates.push(configurationService.updateByCode('context_menu_enabled', config.enabled.toString()));
      }

      if (config.shortcut !== undefined) {
        updates.push(configurationService.updateByCode('context_menu_shortcut', config.shortcut));
        
        // Update the active shortcut if context menu is enabled
        const enabledConfig = await configurationService.getByCode('context_menu_enabled');
        if (enabledConfig?.value === 'true') {
          const shortcutManager = getShortcutManager();
          shortcutManager.updateShortcuts({ primary: config.shortcut });
        }
      }

      if (config.actions !== undefined) {
        updates.push(configurationService.updateByCode('context_menu_actions', JSON.stringify(config.actions)));
      }

      await Promise.all(updates);

      // If enabled state changed, initialize or cleanup accordingly
      if (config.enabled !== undefined) {
        if (config.enabled) {
          await initializeContextMenu();
        } else {
          cleanupContextMenu();
        }
      }

      return { success: true };
    } catch (error) {
      console.error('[context-menu] Error updating configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update configuration'
      };
    }
  });

  console.log('[context-menu] IPC handlers registered successfully');
}

/**
 * Initialize the context menu system
 */
export async function initializeContextMenu(): Promise<void> {
  console.log('[context-menu] Initializing context menu system');
  
  try {
    // Check if context menu is enabled in configuration
    const enabledConfig = await configurationService.getByCode('context_menu_enabled');
    const isEnabled = enabledConfig?.value === 'true';
    
    if (!isEnabled) {
      console.log('[context-menu] Context menu is disabled in configuration');
      return;
    }
    
    // Register IPC handlers
    registerContextMenuIpc();
    
    // Get shortcut configuration
    const shortcutConfig = await configurationService.getByCode('context_menu_shortcut');
    const shortcutValue = shortcutConfig?.value || 'Alt+Space';
    
    // Setup shortcuts and link to window manager
    const shortcutManager = getShortcutManager();
    const windowManager = getWindowManager();
    
    // Update shortcuts based on configuration
    if (shortcutValue !== 'Alt+Space') {
      shortcutManager.updateShortcuts({ primary: shortcutValue });
    }
    
    // When shortcut is triggered, show the menu
    shortcutManager.on('show-menu', async () => {
      console.log('[context-menu] Shortcut triggered event received, showing window...');
      try {
        await windowManager.show();
        console.log('[context-menu] Window shown successfully');
      } catch (error) {
        console.error('[context-menu] Error showing window:', error);
      }
    });
    
    // When escape is pressed, hide the menu
    shortcutManager.on('hide-menu', () => {
      console.log('[context-menu] Escape pressed, hiding window...');
      windowManager.hide();
    });
    
    // Register the global shortcuts
    const registered = shortcutManager.register();
    console.log(`[context-menu] Shortcuts registration result: ${registered}`);
    
    console.log('[context-menu] Context menu system initialized');
  } catch (error) {
    console.error('[context-menu] Error initializing context menu:', error);
  }
}

/**
 * Cleanup context menu resources
 */
export function cleanupContextMenu(): void {
  console.log('[context-menu] Cleaning up context menu');
  
  const shortcutManager = getShortcutManager();
  const windowManager = getWindowManager();
  
  shortcutManager.unregister();
  windowManager.destroy();
  
  console.log('[context-menu] Context menu cleaned up');
}