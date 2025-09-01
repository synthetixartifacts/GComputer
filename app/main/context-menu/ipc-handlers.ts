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

// Track if system is already initialized to prevent duplicates
let isInitialized = false;

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

  // Request accessibility permissions
  ipcMain.handle('context:request-permissions', async (_event: IpcMainInvokeEvent) => {
    try {
      const contextService = getContextService();
      const granted = contextService.requestAccessibilityPermission();
      return {
        success: true,
        granted
      };
    } catch (error) {
      console.error('[context-menu] Error requesting permissions:', error);
      return {
        success: false,
        granted: false,
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

  // Transform selected text (copy, transform, paste back)
  ipcMain.handle('context:transform-selected', async (_event: IpcMainInvokeEvent, transformType: string) => {
    try {
      const contextService = getContextService();
      const windowManager = getWindowManager();
      
      // Check permissions first
      const hasPermission = contextService.checkAccessibilityPermission();
      if (!hasPermission) {
        console.log('[context-menu] ⚠️ No accessibility permission - cannot automate paste');
        return {
          success: false,
          error: 'Accessibility permission required. Check terminal console for instructions.'
        };
      }
      
      // Step 1: Get the pre-captured text
      const selectedText = windowManager.getCapturedText();
      console.log('[context-menu] Using pre-captured text:', selectedText ? `"${selectedText.substring(0, 50)}..."` : 'empty');
      console.log('[context-menu] Text length:', selectedText ? selectedText.length : 0);
      
      if (!selectedText || selectedText === '') {
        console.log('[context-menu] No text was captured');
        console.log('[context-menu] Checking clipboard as last resort...');
        const clipboardText = contextService.getClipboardText();
        if (clipboardText) {
          console.log('[context-menu] Found text in clipboard, using it:', clipboardText.substring(0, 50));
          // Use clipboard text as fallback
          const transformedText = clipboardText.toUpperCase();
          contextService.setClipboardText(transformedText);
          windowManager.hide();
          await new Promise(resolve => setTimeout(resolve, 100));
          await contextService.pasteFromClipboard();
          return {
            success: true,
            originalText: clipboardText,
            transformedText: transformedText,
            requiresManualPaste: !hasPermission
          };
        }
        
        return {
          success: false,
          error: 'No text selected. Select text before opening the menu.'
        };
      }
      
      // Step 2: Transform the text
      let transformedText = selectedText;
      switch(transformType) {
        case 'uppercase':
          transformedText = selectedText.toUpperCase();
          break;
        case 'lowercase':
          transformedText = selectedText.toLowerCase();
          break;
        case 'translate':
          // For now, just uppercase as placeholder for translate
          transformedText = selectedText.toUpperCase();
          break;
        default:
          transformedText = selectedText.toUpperCase();
      }
      console.log('[context-menu] Transformed text:', transformedText);
      
      // Step 3: Put transformed text in clipboard
      contextService.setClipboardText(transformedText);
      
      // Step 4: Hide the context menu window BEFORE pasting
      // This returns focus to the original app
      console.log('[context-menu] Hiding window before paste...');
      windowManager.hide();
      
      // Wait a bit for focus to return to the original app
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 5: Paste it back (simulate Cmd+V)
      console.log('[context-menu] Step 5: Pasting transformed text...');
      await contextService.pasteFromClipboard();
      
      return { 
        success: true,
        originalText: selectedText,
        transformedText: transformedText,
        requiresManualPaste: !hasPermission
      };
    } catch (error) {
      console.error('[context-menu] Error in transform-selected:', error);
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
        // Always cleanup first to prevent duplicate listeners
        cleanupContextMenu();
        
        if (config.enabled) {
          // Re-initialize after cleanup
          await initializeContextMenu();
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
  
  // Prevent duplicate initialization
  if (isInitialized) {
    console.log('[context-menu] Already initialized, cleaning up first...');
    cleanupContextMenu();
  }
  
  try {
    // Check accessibility permissions on macOS (for development awareness)
    if (process.platform === 'darwin') {
      const contextService = getContextService();
      contextService.checkAccessibilityPermission();
    }
    
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
    
    // When shortcut is triggered, copy selected text FIRST, then show the menu
    shortcutManager.on('show-menu', async () => {
      console.log('[context-menu] Shortcut triggered event received');
      try {
        // Step 1: Copy selected text BEFORE showing the window
        const contextService = getContextService();
        const hasPermission = contextService.checkAccessibilityPermission();
        
        if (hasPermission) {
          console.log('[context-menu] Triggering copy command BEFORE showing window...');
          
          // Small delay to ensure the original app has settled after Alt+Space
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Save current clipboard content
          const originalClipboard = contextService.getClipboardText();
          console.log('[context-menu] Current clipboard before copy:', originalClipboard ? originalClipboard.substring(0, 30) + '...' : 'empty');
          
          // Use a unique marker to detect if copy works
          const marker = `__CONTEXT_MENU_MARKER_${Date.now()}__`;
          contextService.setClipboardText(marker);
          
          try {
            // Simulate Cmd+C to copy selected text while original app still has focus
            await contextService.simulateCopyCommand();
            // Give it more time to complete
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Check if we got new text (clipboard changed from marker)
            const newClipboard = contextService.getClipboardText();
            console.log('[context-menu] Clipboard after copy:', newClipboard ? newClipboard.substring(0, 30) + '...' : 'empty');
            
            if (!newClipboard || newClipboard === marker) {
              // Copy didn't work - clipboard still has our marker
              console.log('[context-menu] Copy didn\'t capture new text (still has marker)');
              // Restore original clipboard
              if (originalClipboard) {
                console.log('[context-menu] Restoring original clipboard');
                contextService.setClipboardText(originalClipboard);
              } else {
                contextService.clearClipboard();
              }
            } else {
              console.log('[context-menu] Successfully copied new text (replaced marker)');
              // New text was copied, this is what we'll use
            }
          } catch (copyError) {
            console.log('[context-menu] Failed to trigger copy:', copyError);
            // Restore original clipboard on error
            if (originalClipboard) {
              contextService.setClipboardText(originalClipboard);
            }
          }
        } else {
          console.log('[context-menu] No accessibility permission - user should copy manually first');
        }
        
        // Step 2: Now show the window (which will check clipboard)
        console.log('[context-menu] Now showing window...');
        await windowManager.show();
        console.log('[context-menu] Window shown successfully');
      } catch (error) {
        console.error('[context-menu] Error in show-menu handler:', error);
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
    
    // Mark as initialized
    isInitialized = true;
    
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
  
  // Remove all event listeners to prevent duplicates
  shortcutManager.removeAllListeners();
  shortcutManager.unregister();
  windowManager.destroy();
  
  // Reset initialization flag
  isInitialized = false;
  
  console.log('[context-menu] Context menu cleaned up');
}