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
  private capturedText: string = '';

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
      type: 'panel',  // On macOS, creates a panel that doesn't activate the app
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.cjs'),
        contextIsolation: false,  // Temporarily disable for inline HTML
        nodeIntegration: true,   // Enable for inline HTML to use ipcRenderer
        sandbox: false
      }
    });

    // Load inline HTML for the context menu
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
            <div id="no-text-alert" style="padding: 12px; background: #fee; color: #c00; border-radius: 4px; margin: 8px; display: none;">
              No text selected
            </div>
            <div id="success-alert" style="padding: 12px; background: #efe; color: #060; border-radius: 4px; margin: 8px; display: none;">
              <strong>✓ Transformed!</strong> Press Cmd+V to paste
            </div>
            <div class="menu-item" data-action="translate">
              <span class="menu-icon">🌐</span>
              <span class="menu-label">Translate</span>
              <span class="menu-shortcut">T</span>
            </div>
            <div class="status">Press ESC to close</div>
          </div>
          <script>
            const { ipcRenderer } = require('electron');
            
            let selectedIndex = 0;
            let capturedText = ''; // Store the captured text
            const menuItems = document.querySelectorAll('.menu-item');
            const noTextAlert = document.getElementById('no-text-alert');
            const successAlert = document.getElementById('success-alert');
            
            console.log('[context-menu] Script initialized');
            
            // Listen for captured text from main process
            ipcRenderer.on('context-menu:captured-text', (event, text) => {
              console.log('[context-menu] Received captured text:', text ? text.substring(0, 30) + '...' : 'empty');
              capturedText = text || '';
            });
            
            // Function to show no text alert
            function showNoTextAlert() {
              console.log('[context-menu] Showing no text alert');
              noTextAlert.style.display = 'block';
              successAlert.style.display = 'none';
              
              // Hide alert after 2 seconds
              setTimeout(() => {
                noTextAlert.style.display = 'none';
                console.log('[context-menu] No text alert hidden');
              }, 2000);
            }
            
            // Function to show success alert
            function showSuccessAlert() {
              console.log('[context-menu] Showing success alert');
              successAlert.style.display = 'block';
              noTextAlert.style.display = 'none';
              
              // Hide alert and close window after 2 seconds
              setTimeout(() => {
                successAlert.style.display = 'none';
                console.log('[context-menu] Success alert hidden, closing window');
                ipcRenderer.send('context-menu:hide');
              }, 2000);
            }
            
            // Function to execute translate action
            async function executeTranslateAction() {
              console.log('[context-menu] Executing translate action');
              console.log('[context-menu] Current capturedText in renderer:', capturedText);
              
              try {
                // Copy selected text, transform to uppercase, and paste back
                console.log('[context-menu] Calling transform-selected with uppercase');
                const result = await ipcRenderer.invoke('context:transform-selected', 'uppercase');
                
                if (result.success) {
                  console.log('[context-menu] Transform successful');
                  console.log('[context-menu] Original:', result.originalText);
                  console.log('[context-menu] Transformed:', result.transformedText);
                  
                  // Window will be hidden automatically by the main process
                  // No need to manually close it here
                  
                  if (result.requiresManualPaste) {
                    console.log('[context-menu] Manual paste required - text in clipboard');
                  } else {
                    console.log('[context-menu] Text auto-pasted successfully');
                  }
                } else {
                  console.error('[context-menu] Transform failed:', result.error);
                  // Show error in alert
                  noTextAlert.textContent = result.error || 'Failed to transform text';
                  showNoTextAlert();
                }
              } catch (error) {
                console.error('[context-menu] Error transforming text:', error);
                noTextAlert.textContent = 'Error: ' + error.message;
                showNoTextAlert();
              }
            }
            
            
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
            document.addEventListener('keydown', async (e) => {
              console.log('[context-menu] Key pressed:', e.key);
              
              // Define valid keys that should be handled
              const validKeys = ['ArrowUp', 'ArrowDown', 'Enter', 'Escape', 't', 'T'];
              
              // Check if this is a valid key for our menu
              if (!validKeys.includes(e.key)) {
                // Any other key closes the menu
                console.log('[context-menu] Invalid key pressed, closing menu');
                e.preventDefault();
                ipcRenderer.send('context-menu:hide');
                return;
              }
              
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
                    console.log('[context-menu] Enter pressed, action:', action);
                    
                    if (action === 'translate') {
                      await executeTranslateAction();
                    }
                  }
                  break;
                  
                case 'Escape':
                  e.preventDefault();
                  console.log('[context-menu] Escape pressed, closing menu');
                  ipcRenderer.send('context-menu:hide');
                  break;
                  
                case 't':
                case 'T':
                  // Handle T shortcut for translate
                  e.preventDefault();
                  console.log('[context-menu] T shortcut pressed');
                  await executeTranslateAction();
                  break;
              }
            });
            
            // Handle mouse clicks
            menuItems.forEach((item, index) => {
              item.addEventListener('click', async (e) => {
                e.preventDefault();
                const action = item.dataset.action;
                console.log('[context-menu] Click on action:', action);
                
                if (action === 'translate') {
                  await executeTranslateAction();
                }
              });
              
              item.addEventListener('mouseenter', () => {
                selectedIndex = index;
                updateSelection();
              });
            });
            
            // Initialize selection
            updateSelection();
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
              // Check if click is outside the menu
              const menu = document.getElementById('menu');
              if (!menu.contains(e.target)) {
                console.log('[context-menu] Click outside menu, closing');
                ipcRenderer.send('context-menu:hide');
              }
            });
            
            // Close menu when window loses focus
            window.addEventListener('blur', () => {
              console.log('[context-menu] Window lost focus, closing menu');
              setTimeout(() => {
                ipcRenderer.send('context-menu:hide');
              }, 100); // Small delay to allow for action execution
            });
            
            // Focus the window for keyboard navigation
            window.focus();
            document.body.focus();
            
            console.log('[context-menu] Renderer ready, waiting for user interaction');
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
    
    // Get the text from clipboard (already copied by shortcut handler)
    try {
      console.log('[context-menu] Getting text from clipboard...');
      const { getContextService } = require('./context-service');
      const contextService = getContextService();
      
      // Simply get what's in the clipboard - the copy was already done
      const clipboardText = contextService.getClipboardText();
      console.log('[context-menu] Clipboard content:', clipboardText ? clipboardText.substring(0, 50) + '...' : 'empty');
      
      this.capturedText = clipboardText || '';
      
      if (!this.capturedText) {
        console.log('[context-menu] No text in clipboard - user needs to select text first');
      }
    } catch (error) {
      console.error('[context-menu] Error getting clipboard text:', error);
      this.capturedText = '';
    }
    
    // Don't store our own main window - we only care about external apps
    // this.previouslyFocusedWindow = BrowserWindow.getFocusedWindow();
    // console.log('[context-menu] Not storing focused window to avoid interference');
    
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
    
    // Show window without activating the app
    if (process.platform === 'darwin') {
      // On macOS, use showInactive to prevent app activation
      window.showInactive();
      window.setAlwaysOnTop(true, 'floating', 1);
      // Focus the window without bringing the app forward
      setTimeout(() => {
        window.focus();
      }, 10);
      window.setVisibleOnAllWorkspaces(true);
    } else {
      // On other platforms
      window.showInactive();
      window.setAlwaysOnTop(true, 'floating');
      setTimeout(() => {
        window.focus();
      }, 10);
      window.setVisibleOnAllWorkspaces(true);
    }
    
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
    
    // Always send the captured text to the window (even if empty - let renderer handle it)
    setTimeout(() => {
      console.log('[context-menu] Sending captured text to overlay:', this.capturedText ? `"${this.capturedText.substring(0, 20)}..."` : 'empty');
      this.sendToOverlay('context-menu:captured-text', this.capturedText || '');
    }, 50);
    
    this.emit('shown', { x, y });
  }

  /**
   * Hide the context menu overlay
   */
  hide(): void {
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
      this.isVisible = false;
      this.previouslyFocusedWindow = null;
      // Don't clear captured text - it might be needed for retry
      return;
    }

    console.log('[context-menu] Hiding window and resetting state');
    
    // Simply hide and blur the overlay window
    this.overlayWindow.hide();
    this.overlayWindow.blur();
    
    // Reset visibility state
    this.isVisible = false;
    this.previouslyFocusedWindow = null;
    // Don't clear captured text - keep it for potential retry
    // Text will be refreshed on next show() anyway
    
    console.log('[context-menu] Window hidden and state reset');
    
    // Unregister Escape key when menu is hidden
    const { getShortcutManager } = require('./shortcuts');
    const shortcutManager = getShortcutManager();
    shortcutManager.unregisterEscape();
    
    // Don't try to restore focus - let the OS handle it naturally
    
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
    // Handle hide request from renderer (using 'on' for regular IPC message)
    ipcMain.on('context-menu:hide', () => {
      console.log('[context-menu] Received hide request from renderer');
      this.hide();
    });

    // Also handle as invoke for compatibility
    ipcMain.handle('context-menu:hide', () => {
      console.log('[context-menu] Received hide request via invoke');
      this.hide();
    });

    ipcMain.handle('context-menu:get-position', () => {
      return this.lastPosition;
    });

    // Handle get selected text request
    ipcMain.handle('context:get-selected-text', async () => {
      console.log('[context-menu] Getting selected text from stored value');
      // Return the text that was captured BEFORE the window was shown
      // This avoids trying to capture text while our window has focus
      return {
        success: true,
        text: this.capturedText || ''
      };
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
   * Get the captured text
   */
  getCapturedText(): string {
    return this.capturedText;
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