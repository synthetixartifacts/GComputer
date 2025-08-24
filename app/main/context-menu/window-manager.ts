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
      maxHeight: 600,
      frame: false,
      transparent: false,  // Changed to false to ensure visibility
      backgroundColor: '#ffffff',  // Set background color
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      focusable: true,
      hasShadow: true,
      show: false,
      opacity: 1.0,  // Ensure full opacity
      webPreferences: {
        preload: path.join(__dirname, '../../preload/index.cjs'),
        contextIsolation: false,  // Temporarily disable for inline HTML
        nodeIntegration: true,   // Enable for inline HTML to use ipcRenderer
        sandbox: false
      }
    });

    // For now, use inline HTML for both dev and production
    // This ensures it works immediately
    this.loadInlineHTML();
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
            const items = document.querySelectorAll('.menu-item');
            
            // Update selection
            function updateSelection() {
              items.forEach((item, i) => {
                if (i === selectedIndex) {
                  item.classList.add('selected');
                } else {
                  item.classList.remove('selected');
                }
              });
            }
            
            // Handle click
            items.forEach((item, index) => {
              item.addEventListener('click', () => {
                const action = item.dataset.action;
                console.log('Action clicked:', action);
                ipcRenderer.invoke('context:execute-action', action, '');
                window.close();
              });
              
              item.addEventListener('mouseenter', () => {
                selectedIndex = index;
                updateSelection();
              });
            });
            
            // Handle keyboard
            document.addEventListener('keydown', (e) => {
              switch(e.key) {
                case 'ArrowUp':
                  e.preventDefault();
                  selectedIndex = Math.max(0, selectedIndex - 1);
                  updateSelection();
                  break;
                  
                case 'ArrowDown':
                  e.preventDefault();
                  selectedIndex = Math.min(items.length - 1, selectedIndex + 1);
                  updateSelection();
                  break;
                  
                case 'Enter':
                  e.preventDefault();
                  if (items[selectedIndex]) {
                    items[selectedIndex].click();
                  }
                  break;
                  
                case 'Escape':
                  e.preventDefault();
                  window.close();
                  break;
                  
                case 't':
                case 'T':
                  e.preventDefault();
                  document.querySelector('[data-action="translate"]').click();
                  break;
                  
                case 'g':
                case 'G':
                  e.preventDefault();
                  document.querySelector('[data-action="grammar"]').click();
                  break;
                  
                case 's':
                case 'S':
                  e.preventDefault();
                  document.querySelector('[data-action="summarize"]').click();
                  break;
                  
                case 'p':
                case 'P':
                  e.preventDefault();
                  document.querySelector('[data-action="screenshot"]').click();
                  break;
              }
            });
            
            // Initial selection
            updateSelection();
            
            console.log('[context-menu] Inline menu loaded');
          </script>
        </body>
      </html>
    `;
    
    this.overlayWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
      .then(() => {
        console.log('[context-menu] Inline HTML loaded successfully');
      })
      .catch(error => {
        console.error('[context-menu] Failed to load inline HTML:', error);
      });

    // Handle window events
    // TEMPORARILY DISABLE BLUR HANDLING TO DEBUG
    // this.overlayWindow.on('blur', () => {
    //   console.log('[context-menu] Window lost focus, hiding');
    //   this.hide();
    // });
    
    this.overlayWindow.on('focus', () => {
      console.log('[context-menu] Window gained focus');
    });
    
    this.overlayWindow.on('show', () => {
      console.log('[context-menu] Window show event');
    });

    this.overlayWindow.on('closed', () => {
      console.log('[context-menu] Window closed');
      this.overlayWindow = null;
      this.isVisible = false;
    });

    // Don't prevent close for now - let's see if window stays open
    // this.overlayWindow.on('close', (event) => {
    //   if (!this.overlayWindow?.isDestroyed()) {
    //     event.preventDefault();
    //     this.hide();
    //   }
    // });

    return this.overlayWindow;
  }

  /**
   * Show the context menu at cursor position or specified position
   */
  show(position?: WindowPosition): void {
    console.log('[context-menu] Show method called');
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
    
    // Show and focus the window
    window.show();
    window.focus();
    
    // Force the window to stay on top
    window.setAlwaysOnTop(true, 'floating');
    window.setVisibleOnAllWorkspaces(true);
    
    // Open dev tools for debugging (TEMPORARY)
    window.webContents.openDevTools({ mode: 'detach' });
    
    this.isVisible = true;
    console.log(`[context-menu] Window shown at position: ${x}, ${y}`);
    console.log(`[context-menu] Window visible: ${window.isVisible()}`);
    console.log(`[context-menu] Window focused: ${window.isFocused()}`);
    
    this.emit('shown', { x, y });
  }

  /**
   * Hide the context menu overlay
   */
  hide(): void {
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
      return;
    }

    this.overlayWindow.hide();
    this.isVisible = false;
    console.log('[context-menu] Hidden');
    
    this.emit('hidden');
  }

  /**
   * Toggle visibility of the context menu
   */
  toggle(position?: WindowPosition): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show(position);
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