/**
 * Context Acquisition Service
 * Handles capturing selected text from the active application
 */

import { clipboard, systemPreferences } from 'electron';

export interface ContextData {
  selectedText: string;
  timestamp: number;
  source?: string;
}

export class ContextAcquisitionService {
  private clipboardBackup: string = '';
  private lastCaptureTime: number = 0;
  private captureTimeout: number = 100; // ms to wait for clipboard update
  private hasCheckedPermissions: boolean = false;
  public hasAccessibilityPermission: boolean = false;

  /**
   * Check accessibility permissions on macOS
   */
  checkAccessibilityPermission(): boolean {
    if (process.platform !== 'darwin') {
      return true; // Not macOS, no special permissions needed
    }
    
    if (!this.hasCheckedPermissions) {
      try {
        // Check if we have accessibility permissions
        this.hasAccessibilityPermission = systemPreferences.isTrustedAccessibilityClient(false);
        this.hasCheckedPermissions = true;
        
        if (!this.hasAccessibilityPermission) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('[context-menu] ⚠️  ACCESSIBILITY PERMISSION REQUIRED');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');
          console.log('For DEVELOPMENT mode, add your terminal to Accessibility:');
          console.log('');
          console.log('1. Open: System Preferences > Security & Privacy > Privacy > Accessibility');
          console.log('2. Click the lock to make changes');
          console.log('3. Add and enable one of these:');
          console.log('   - Terminal (if using Terminal.app)');
          console.log('   - iTerm (if using iTerm2)');
          console.log('   - Visual Studio Code (if using VS Code terminal)');
          console.log('   - Cursor (if using Cursor IDE)');
          console.log('   - Your terminal app');
          console.log('');
          console.log('4. Restart npm run dev after granting permission');
          console.log('');
          console.log('For PRODUCTION: The packaged app will appear as "GComputer"');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        } else {
          console.log('[context-menu] ✅ Accessibility permission granted');
        }
      } catch (error) {
        console.error('[context-menu] Error checking accessibility permissions:', error);
        this.hasAccessibilityPermission = false;
      }
    }
    
    return this.hasAccessibilityPermission;
  }
  
  /**
   * Request accessibility permissions on macOS (opens system preferences)
   */
  requestAccessibilityPermission(): boolean {
    if (process.platform !== 'darwin') {
      return true; // Not macOS, no special permissions needed
    }
    
    try {
      // This will prompt the user and open System Preferences if needed
      // The 'true' parameter means it will prompt the user
      this.hasAccessibilityPermission = systemPreferences.isTrustedAccessibilityClient(true);
      this.hasCheckedPermissions = true;
      
      if (this.hasAccessibilityPermission) {
        console.log('[context-menu] Accessibility permission granted!');
      } else {
        console.log('[context-menu] Accessibility permission dialog shown to user');
      }
      
      return this.hasAccessibilityPermission;
    } catch (error) {
      console.error('[context-menu] Error requesting accessibility permissions:', error);
      return false;
    }
  }

  /**
   * Capture selected text using clipboard method
   * This simulates Ctrl+C to copy selected text, then restores clipboard
   */
  async captureSelectedText(): Promise<ContextData> {
    try {
      console.log('[context-menu] Capturing selected text');
      
      // Check permissions first
      const hasPermission = this.checkAccessibilityPermission();
      
      // Backup current clipboard content
      this.clipboardBackup = clipboard.readText();
      
      // Try different methods to capture selected text
      let selectedText = '';
      
      // If we have permissions, try to simulate copy
      if (hasPermission) {
        // Method 1: Try to simulate copy (requires accessibility permissions on macOS)
        try {
          // Clear clipboard to detect if copy worked
          clipboard.clear();
          
          // Try to simulate Ctrl+C (or Cmd+C on macOS)
          await this.simulateCopy();
          
          // Wait for clipboard to update
          await this.delay(this.captureTimeout);
          
          // Read the new clipboard content
          selectedText = clipboard.readText();
          
          // Restore original clipboard content if we got something new
          if (selectedText && selectedText !== this.clipboardBackup) {
            // Restore after a small delay to avoid conflicts
            setTimeout(() => {
              clipboard.writeText(this.clipboardBackup);
            }, 100);
          }
        } catch (copyError) {
          console.log('[context-menu] Copy simulation failed despite permissions:', copyError);
          // Fall through to fallback method
        }
      }
      
      // Fallback: Use clipboard content if no permissions or simulation failed
      if (!selectedText) {
        const currentClipboard = clipboard.readText();
        if (currentClipboard) {
          // Use current clipboard content
          selectedText = currentClipboard;
          console.log('[context-menu] Using clipboard content as selected text (user should copy text with Cmd+C first)');
        } else {
          console.log('[context-menu] No text in clipboard. User needs to:');
          console.log('[context-menu] 1. Select text');
          console.log('[context-menu] 2. Copy it with Cmd+C');
          console.log('[context-menu] 3. Then open context menu with Alt+Space');
          selectedText = '';
        }
      }
      
      this.lastCaptureTime = Date.now();
      
      const contextData: ContextData = {
        selectedText: selectedText || '',
        timestamp: this.lastCaptureTime,
        source: selectedText ? 'clipboard' : 'empty'
      };
      
      console.log(`[context-menu] Captured text: ${selectedText?.substring(0, 50)}...`);
      return contextData;
      
    } catch (error) {
      console.error('[context-menu] Error capturing selected text:', error);
      return {
        selectedText: '',
        timestamp: Date.now(),
        source: 'error'
      };
    }
  }

  /**
   * Public method to simulate copy command
   */
  async simulateCopyCommand(): Promise<void> {
    try {
      // Check permissions first on macOS
      if (process.platform === 'darwin') {
        // Always check fresh to show status
        const hasPermission = this.checkAccessibilityPermission();
        if (!hasPermission) {
          console.log('[context-menu] ❌ Cannot simulate Cmd+C without accessibility permission');
          throw new Error('Accessibility permissions required. Add your terminal app to System Preferences > Security & Privacy > Privacy > Accessibility');
        }
      }
      
      console.log('[context-menu] Simulating copy command (Cmd+C)...');
      // Use native key simulation (platform-specific)
      await this.simulateCopyNative();
      console.log('[context-menu] Copy command sent');
    } catch (error) {
      console.error('[context-menu] Error simulating copy:', error);
      throw error;
    }
  }

  /**
   * Simulate copy keyboard shortcut based on platform
   */
  private async simulateCopy(): Promise<void> {
    try {
      // Check permissions first on macOS
      if (process.platform === 'darwin' && !this.hasAccessibilityPermission) {
        throw new Error('Accessibility permissions required for automatic copy');
      }
      
      // Use native key simulation (platform-specific)
      await this.simulateCopyNative();
    } catch (error) {
      console.error('[context-menu] Error simulating copy:', error);
      throw error;
    }
  }

  /**
   * Try to load robotjs for keyboard simulation
   */
  private async tryLoadRobotJS(): Promise<any> {
    // robotjs removed due to build issues with native modules
    // Using AppleScript/PowerShell instead
    return null;
  }

  /**
   * Native keyboard simulation fallback
   */
  private async simulateCopyNative(): Promise<void> {
    // This is a simplified version - in production you might want to use
    // platform-specific solutions or require robotjs as a dependency
    
    if (process.platform === 'win32') {
      // Windows: Use PowerShell or native Windows API
      const { exec } = require('child_process');
      return new Promise((resolve, reject) => {
        exec('powershell -command "[System.Windows.Forms.SendKeys]::SendWait(\'^c\')"', 
          (error: any) => {
            if (error) reject(error);
            else resolve();
          }
        );
      });
    } else if (process.platform === 'darwin') {
      // macOS: Use AppleScript
      const { exec } = require('child_process');
      return new Promise((resolve, reject) => {
        exec('osascript -e \'tell application "System Events" to keystroke "c" using command down\'',
          (error: any) => {
            if (error) reject(error);
            else resolve();
          }
        );
      });
    } else {
      // Linux: Use xdotool if available
      const { exec } = require('child_process');
      return new Promise((resolve, reject) => {
        exec('xdotool key ctrl+c', (error: any) => {
          if (error) {
            console.warn('[context-menu] xdotool not available on Linux');
            resolve(); // Don't reject, just continue
          } else {
            resolve();
          }
        });
      });
    }
  }

  /**
   * Get text directly from clipboard (without simulation)
   */
  getClipboardText(): string {
    try {
      return clipboard.readText();
    } catch (error) {
      console.error('[context-menu] Error reading clipboard:', error);
      return '';
    }
  }

  /**
   * Set clipboard text
   */
  setClipboardText(text: string): void {
    try {
      clipboard.writeText(text);
    } catch (error) {
      console.error('[context-menu] Error writing to clipboard:', error);
    }
  }
  
  /**
   * Clear clipboard
   */
  clearClipboard(): void {
    try {
      clipboard.clear();
    } catch (error) {
      console.error('[context-menu] Error clearing clipboard:', error);
    }
  }

  /**
   * Paste text from clipboard using keyboard simulation
   */
  async pasteFromClipboard(): Promise<void> {
    try {
      const clipboardContent = this.getClipboardText();
      console.log('[context-menu] Attempting to paste from clipboard:', clipboardContent);
      
      // Check if we have accessibility permissions on macOS
      if (process.platform === 'darwin') {
        // Re-check permissions each time
        const hasPermission = this.checkAccessibilityPermission();
        
        if (!hasPermission) {
          console.log('[context-menu] ❌ Cannot simulate Cmd+V without accessibility permission');
          console.log('[context-menu] Text is in clipboard:', clipboardContent);
          console.log('[context-menu] User needs to manually paste with Cmd+V');
          // Don't throw error, just return - text is in clipboard
          return;
        }
      }
      
      console.log('[context-menu] Simulating paste command (Cmd+V)...');
      // Use native key simulation
      await this.simulatePasteNative();
      console.log('[context-menu] Paste command sent successfully');
    } catch (error) {
      console.error('[context-menu] Error pasting from clipboard:', error);
      // Don't throw - text is still in clipboard for manual paste
      console.log('[context-menu] Text has been copied to clipboard. User can paste manually with Cmd+V');
    }
  }

  /**
   * Native keyboard simulation for paste
   */
  private async simulatePasteNative(): Promise<void> {
    if (process.platform === 'win32') {
      // Windows: Use PowerShell
      const { exec } = require('child_process');
      return new Promise((resolve, reject) => {
        exec('powershell -command "[System.Windows.Forms.SendKeys]::SendWait(\'^v\')"', 
          (error: any) => {
            if (error) reject(error);
            else resolve();
          }
        );
      });
    } else if (process.platform === 'darwin') {
      // macOS: Use AppleScript
      const { exec } = require('child_process');
      return new Promise((resolve, reject) => {
        exec('osascript -e \'tell application "System Events" to keystroke "v" using command down\'',
          (error: any) => {
            if (error) reject(error);
            else resolve();
          }
        );
      });
    } else {
      // Linux: Use xdotool if available
      const { exec } = require('child_process');
      return new Promise((resolve, reject) => {
        exec('xdotool key ctrl+v', (error: any) => {
          if (error) {
            console.warn('[context-menu] xdotool not available on Linux');
            resolve(); // Don't reject, just continue
          } else {
            resolve();
          }
        });
      });
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get the last capture timestamp
   */
  getLastCaptureTime(): number {
    return this.lastCaptureTime;
  }

  /**
   * Clear the backup clipboard content
   */
  clearBackup(): void {
    this.clipboardBackup = '';
  }
}

// Singleton instance
let contextService: ContextAcquisitionService | null = null;

/**
 * Get the context service instance
 */
export function getContextService(): ContextAcquisitionService {
  if (!contextService) {
    contextService = new ContextAcquisitionService();
  }
  return contextService;
}