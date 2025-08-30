/**
 * Context Menu Overlay Window Manager
 * Manages the creation, positioning, and lifecycle of the context menu overlay window
 */

import { BrowserWindow, screen, ipcMain } from 'electron';
import type { Rectangle } from 'electron';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface WindowPosition {
  x: number;
  y: number;
}

export class ContextMenuWindowManager extends EventEmitter {
  private overlayWindow: BrowserWindow | null = null;
  private isVisible: boolean = false;
  private lastPosition: WindowPosition | null = null;
  private previouslyFocusedWindow: BrowserWindow | null = null;

  constructor() {
    super();
    this.setupIpcHandlers();
  }

  /**
   * Create the overlay window (lazy initialization)
   */
  private createWindow(): BrowserWindow {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      return this.overlayWindow;
    }

    console.log('[context-menu] Creating overlay window');

    this.overlayWindow = new BrowserWindow({
      width: 280,
      height: 400,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      hasShadow: true,
      show: false,
      opacity: 1.0,  // Ensure full opacity
      focusable: true,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.cjs'),
        contextIsolation: false,  // Temporarily disable for inline HTML
        nodeIntegration: true,   // Enable for inline HTML to use ipcRenderer
        sandbox: false
      }
    });

    // Load inline HTML for now to ensure it works
    this.loadInlineHTML();
    
    return this.overlayWindow;
  }

  /**
   * Load inline HTML content with the context menu
   */
  private loadInlineHTML(): void {
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) return;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Context Menu</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: transparent;
              user-select: none;
            }
            
            .context-menu {
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              padding: 4px;
              min-width: 200px;
            }
            
            .menu-item {
              display: flex;
              align-items: center;
              padding: 8px 12px;
              border-radius: 4px;
              cursor: pointer;
              transition: background 0.15s;
            }
            
            .menu-item:hover {
              background: #f0f0f0;
            }
            
            .menu-item.selected {
              background: #e3f2fd;
            }
            
            .menu-icon {
              margin-right: 12px;
              width: 20px;
              text-align: center;
            }
            
            .menu-label {
              flex: 1;
              font-size: 14px;
            }
            
            .menu-shortcut {
              margin-left: 20px;
              font-size: 12px;
              color: #666;
              background: #eee;
              padding: 2px 6px;
              border-radius: 3px;
            }
            
            .divider {
              height: 1px;
              background: #e0e0e0;
              margin: 4px 8px;
            }
            
            .status {
              padding: 8px 12px;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #e0e0e0;
              margin-top: 4px;
            }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
              .context-menu {
                background: #2a2a2a;
                color: #f0f0f0;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
              }
              
              .menu-item:hover {
                background: #3a3a3a;
              }
              
              .menu-item.selected {
                background: #404040;
              }
              
              .menu-shortcut {
                background: #444;
                color: #ccc;
              }
              
              .divider {
                background: #444;
              }
              
              .status {
                color: #999;
                border-color: #444;
              }
            }
          </style>
        </head>
        <body>
          <div class="context-menu" id="menu">
            <div class="menu-item" data-action="translate">
              <span class="menu-icon">🌐</span>
              <span class="menu-label">Translate</span>
              <span class="menu-shortcut">T</span>
            </div>
            <div class="menu-item" data-action="grammar">
              <span class="menu-icon">✏️</span>
              <span class="menu-label">Fix Grammar</span>
              <span class="menu-shortcut">G</span>
            </div>
            <div class="menu-item" data-action="summarize">
              <span class="menu-icon">📝</span>
              <span class="menu-label">Summarize</span>
              <span class="menu-shortcut">S</span>
            </div>
            <div class="divider"></div>
            <div class="menu-item" data-action="screenshot">
              <span class="menu-icon">📸</span>
              <span class="menu-label">Screenshot</span>
              <span class="menu-shortcut">P</span>
            </div>
            <div class="status">Press ESC to close</div>
          </div>
          <script>
            const { ipcRenderer } = require('electron');
            
            let selectedIndex = 0;
            const menuItems = document.querySelectorAll('.menu-item');
            
            // Update selected item
            function updateSelection() {
              menuItems.forEach((item, index) => {
                if (index === selectedIndex) {
                  item.classList.add('selected');
                } else {
                  item.classList.remove('selected');
                }
              });
            }
            
            // Handle keyboard navigation
            document.addEventListener('keydown', (e) => {
              switch(e.key) {
                case 'ArrowUp':
                  e.preventDefault();
                  selectedIndex = Math.max(0, selectedIndex - 1);
                  updateSelection();
                  break;
                case 'ArrowDown':
                  e.preventDefault();
                  selectedIndex = Math.min(menuItems.length - 1, selectedIndex + 1);
                  updateSelection();
                  break;
                case 'Enter':
                  e.preventDefault();
                  const selectedItem = menuItems[selectedIndex];
                  if (selectedItem) {
                    const action = selectedItem.dataset.action;
                    console.log('Executing action:', action);
                    ipcRenderer.send('context-menu:action', { action });
                  }
                  break;
                case 'Escape':
                  e.preventDefault();
                  ipcRenderer.send('context-menu:hide');
                  break;
              }
              
              // Handle shortcut keys
              const shortcutKey = e.key.toUpperCase();
              menuItems.forEach(item => {
                const shortcut = item.querySelector('.menu-shortcut')?.textContent;
                if (shortcut === shortcutKey) {
                  e.preventDefault();
                  const action = item.dataset.action;
                  console.log('Executing action via shortcut:', action);
                  ipcRenderer.send('context-menu:action', { action });
                }
              });
            });
            
            // Handle mouse clicks
            menuItems.forEach((item, index) => {
              item.addEventListener('click', () => {
                const action = item.dataset.action;
                console.log('Executing action via click:', action);
                ipcRenderer.send('context-menu:action', { action });
              });
              
              item.addEventListener('mouseenter', () => {
                selectedIndex = index;
                updateSelection();
              });
            });
            
            // Initialize selection
            updateSelection();
            
            // Focus the window for keyboard navigation
            window.focus();
            document.body.focus();
            
            console.log('[context-menu] Renderer ready');
          </script>
        </body>
      </html>
    `;
    
    this.overlayWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    console.log('[context-menu] Loaded inline HTML');
  }

  /**
   * Show the context menu at cursor position or specified position
   */
  async show(position?: WindowPosition): Promise<void> {
    console.log('[context-menu] Show method called');
    console.log('[context-menu] Current state - isVisible:', this.isVisible);
    
    // If already visible, just hide it (toggle behavior)
    if (this.isVisible && this.overlayWindow && !this.overlayWindow.isDestroyed() && this.overlayWindow.isVisible()) {
      console.log('[context-menu] Window already visible, hiding instead');
      this.hide();
      return;
    }
    
    // Store the currently focused window before showing our overlay
    this.previouslyFocusedWindow = BrowserWindow.getFocusedWindow();
    console.log('[context-menu] Stored previously focused window:', this.previouslyFocusedWindow ? 'exists' : 'none');
    
    const window = this.createWindow();
    
    if (!window || window.isDestroyed()) {
      console.error('[context-menu] Cannot show - window is destroyed');
      return;
    }

    // Get position from cursor if not provided
    const pos = position || screen.getCursorScreenPoint();
    console.log(`[context-menu] Mouse position: ${JSON.stringify(pos)}`);
    
    // Ensure window stays within screen bounds
    const { x, y } = this.adjustPositionToScreen(pos, window.getBounds());
    
    this.lastPosition = { x, y };
    
    console.log(`[context-menu] Setting window position to: ${x}, ${y}`);
    window.setPosition(x, y);
    
    // Show window without stealing focus from other apps
    if (process.platform === 'darwin') {
      // On macOS, use showInactive to prevent bringing main window forward
      window.showInactive();
      window.setAlwaysOnTop(true, 'screen-saver');
      // Focus after showing to ensure keyboard input works
      setTimeout(() => {
        window.focus();
      }, 10);
    } else {
      // On other platforms
      window.showInactive();
      window.focus();
      window.setAlwaysOnTop(true, 'floating');
    }
    
    window.setVisibleOnAllWorkspaces(true);
    
    // Dev tools disabled - remove this line to enable for debugging
    // window.webContents.openDevTools({ mode: 'detach' });
    
    this.isVisible = true;
    console.log(`[context-menu] Window shown at position: ${x}, ${y}`);
    console.log(`[context-menu] Window visible: ${window.isVisible()}`);
    console.log(`[context-menu] Window focused: ${window.isFocused()}`);
    
    // Register Escape key to close the menu
    const { getShortcutManager } = require('./shortcuts');
    const shortcutManager = getShortcutManager();
    shortcutManager.registerEscape();
    
    this.emit('shown', { x, y });
  }

  /**
   * Hide the context menu overlay
   */
  hide(): void {
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
      this.isVisible = false;
      this.previouslyFocusedWindow = null;
      return;
    }

    console.log('[context-menu] Hiding window');
    
    // Simply hide and blur the overlay window
    this.overlayWindow.hide();
    this.overlayWindow.blur();
    
    this.isVisible = false;
    this.previouslyFocusedWindow = null;
    console.log('[context-menu] Window hidden');
    
    // Unregister Escape key when menu is hidden
    const { getShortcutManager } = require('./shortcuts');
    const shortcutManager = getShortcutManager();
    shortcutManager.unregisterEscape();
    
    this.emit('hidden');
  }

  /**
   * Toggle visibility of the context menu
   */
  async toggle(position?: WindowPosition): Promise<void> {
    if (this.isVisible) {
      this.hide();
    } else {
      await this.show(position);
    }
  }

  /**
   * Adjust position to ensure window stays within screen bounds
   */
  private adjustPositionToScreen(position: WindowPosition, windowBounds: Rectangle): WindowPosition {
    const displays = screen.getAllDisplays();
    const currentDisplay = screen.getDisplayNearestPoint(position);
    
    if (!currentDisplay) {
      return position;
    }

    const { x: displayX, y: displayY, width: displayWidth, height: displayHeight } = currentDisplay.workArea;
    
    let { x, y } = position;
    const { width: windowWidth, height: windowHeight } = windowBounds;

    // Adjust X position
    if (x + windowWidth > displayX + displayWidth) {
      x = displayX + displayWidth - windowWidth - 10; // 10px margin
    }
    if (x < displayX) {
      x = displayX + 10;
    }

    // Adjust Y position
    if (y + windowHeight > displayY + displayHeight) {
      y = displayY + displayHeight - windowHeight - 10;
    }
    if (y < displayY) {
      y = displayY + 10;
    }

    return { x, y };
  }

  /**
   * Setup IPC handlers for window control
   */
  private setupIpcHandlers(): void {
    ipcMain.handle('context-menu:hide', () => {
      this.hide();
    });

    ipcMain.handle('context-menu:get-position', () => {
      return this.lastPosition;
    });
  }

  /**
   * Check if the overlay is currently visible
   */
  isOverlayVisible(): boolean {
    return this.isVisible && !!this.overlayWindow && !this.overlayWindow.isDestroyed();
  }

  /**
   * Get the overlay window instance
   */
  getWindow(): BrowserWindow | null {
    return this.overlayWindow;
  }

  /**
   * Destroy the overlay window completely
   */
  destroy(): void {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.destroy();
      this.overlayWindow = null;
      this.isVisible = false;
    }
  }

  /**
   * Send data to the overlay window
   */
  sendToOverlay(channel: string, data: any): void {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.webContents.send(channel, data);
    }
  }
}

// Singleton instance
let windowManager: ContextMenuWindowManager | null = null;

/**
 * Get the window manager instance
 */
export function getWindowManager(): ContextMenuWindowManager {
  if (!windowManager) {
    windowManager = new ContextMenuWindowManager();
  }
  return windowManager;
}