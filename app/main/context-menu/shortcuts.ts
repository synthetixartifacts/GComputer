/**
 * Global Shortcut Registration for Context Menu
 * Handles system-wide keyboard shortcuts to trigger the context menu overlay
 */

import { globalShortcut, app } from 'electron';
import { EventEmitter } from 'events';

export interface ShortcutConfig {
  primary: string;
  secondary?: string;
}

export class ContextMenuShortcuts extends EventEmitter {
  private shortcuts: ShortcutConfig = {
    primary: 'Alt+Space',
    secondary: 'CommandOrControl+Shift+G'
  };
  
  private registered: boolean = false;
  private escapeRegistered: boolean = false;

  constructor(customShortcuts?: Partial<ShortcutConfig>) {
    super();
    if (customShortcuts) {
      this.shortcuts = { ...this.shortcuts, ...customShortcuts };
    }
  }

  /**
   * Register all configured global shortcuts
   */
  register(): boolean {
    if (this.registered) {
      console.log('[context-menu] Shortcuts already registered');
      return true;
    }

    console.log('[context-menu] Attempting to register shortcuts...');
    console.log('[context-menu] Primary shortcut:', this.shortcuts.primary);
    console.log('[context-menu] Secondary shortcut:', this.shortcuts.secondary);

    try {
      // Register primary shortcut
      const primarySuccess = globalShortcut.register(this.shortcuts.primary, () => {
        console.log(`[context-menu] Primary shortcut triggered: ${this.shortcuts.primary}`);
        this.emit('show-menu');
      });

      if (!primarySuccess) {
        console.error(`[context-menu] Failed to register primary shortcut: ${this.shortcuts.primary}`);
        console.error('[context-menu] Is the shortcut already in use by another app?');
      } else {
        console.log(`[context-menu] Successfully registered primary shortcut: ${this.shortcuts.primary}`);
      }

      // Register secondary shortcut if configured
      if (this.shortcuts.secondary) {
        const secondarySuccess = globalShortcut.register(this.shortcuts.secondary, () => {
          console.log(`[context-menu] Secondary shortcut triggered: ${this.shortcuts.secondary}`);
          this.emit('show-menu');
        });

        if (!secondarySuccess) {
          console.error(`[context-menu] Failed to register secondary shortcut: ${this.shortcuts.secondary}`);
        }
      }

      this.registered = true;
      console.log('[context-menu] Global shortcuts registered successfully');
      return true;
    } catch (error) {
      console.error('[context-menu] Error registering shortcuts:', error);
      return false;
    }
  }

  /**
   * Register Escape key to hide the menu
   */
  registerEscape(): void {
    if (this.escapeRegistered) {
      return;
    }
    
    try {
      const success = globalShortcut.register('Escape', () => {
        console.log('[context-menu] Escape pressed, hiding menu');
        this.emit('hide-menu');
      });
      
      if (success) {
        this.escapeRegistered = true;
        console.log('[context-menu] Escape shortcut registered');
      } else {
        console.error('[context-menu] Failed to register Escape shortcut');
      }
    } catch (error) {
      console.error('[context-menu] Error registering Escape:', error);
    }
  }
  
  /**
   * Unregister Escape key
   */
  unregisterEscape(): void {
    if (!this.escapeRegistered) {
      return;
    }
    
    try {
      if (globalShortcut.isRegistered('Escape')) {
        globalShortcut.unregister('Escape');
        this.escapeRegistered = false;
        console.log('[context-menu] Escape shortcut unregistered');
      }
    } catch (error) {
      console.error('[context-menu] Error unregistering Escape:', error);
    }
  }

  /**
   * Unregister all global shortcuts
   */
  unregister(): void {
    if (!this.registered) {
      return;
    }

    try {
      if (globalShortcut.isRegistered(this.shortcuts.primary)) {
        globalShortcut.unregister(this.shortcuts.primary);
      }

      if (this.shortcuts.secondary && globalShortcut.isRegistered(this.shortcuts.secondary)) {
        globalShortcut.unregister(this.shortcuts.secondary);
      }

      // Also unregister Escape if it's registered
      this.unregisterEscape();
      
      this.registered = false;
      console.log('[context-menu] Global shortcuts unregistered');
    } catch (error) {
      console.error('[context-menu] Error unregistering shortcuts:', error);
    }
  }

  /**
   * Check if shortcuts are currently registered
   */
  isRegistered(): boolean {
    return this.registered;
  }

  /**
   * Get current shortcut configuration
   */
  getShortcuts(): ShortcutConfig {
    return { ...this.shortcuts };
  }

  /**
   * Update shortcut configuration and re-register
   */
  updateShortcuts(newShortcuts: Partial<ShortcutConfig>): boolean {
    this.unregister();
    this.shortcuts = { ...this.shortcuts, ...newShortcuts };
    return this.register();
  }
}

// Singleton instance
let shortcutManager: ContextMenuShortcuts | null = null;

/**
 * Initialize and get the shortcut manager instance
 */
export function getShortcutManager(): ContextMenuShortcuts {
  if (!shortcutManager) {
    shortcutManager = new ContextMenuShortcuts();
  }
  return shortcutManager;
}

/**
 * Clean up shortcuts on app quit
 */
app.on('will-quit', () => {
  if (shortcutManager) {
    shortcutManager.unregister();
    shortcutManager = null;
  }
});