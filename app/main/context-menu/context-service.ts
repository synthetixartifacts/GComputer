/**
 * Context Acquisition Service
 * Handles capturing selected text from the active application
 */

import { clipboard } from 'electron';

export interface ContextData {
  selectedText: string;
  timestamp: number;
  source?: string;
}

export class ContextAcquisitionService {
  private clipboardBackup: string = '';
  private lastCaptureTime: number = 0;
  private captureTimeout: number = 100; // ms to wait for clipboard update

  /**
   * Capture selected text using clipboard method
   * This simulates Ctrl+C to copy selected text, then restores clipboard
   */
  async captureSelectedText(): Promise<ContextData> {
    try {
      console.log('[context-menu] Capturing selected text');
      
      // Backup current clipboard content
      this.clipboardBackup = clipboard.readText();
      
      // Clear clipboard to detect if copy worked
      clipboard.clear();
      
      // Simulate Ctrl+C (or Cmd+C on macOS)
      await this.simulateCopy();
      
      // Wait for clipboard to update
      await this.delay(this.captureTimeout);
      
      // Read the new clipboard content
      const selectedText = clipboard.readText();
      
      // Restore original clipboard content if we got something new
      if (selectedText && selectedText !== this.clipboardBackup) {
        // Restore after a small delay to avoid conflicts
        setTimeout(() => {
          clipboard.writeText(this.clipboardBackup);
        }, 100);
      }
      
      this.lastCaptureTime = Date.now();
      
      const contextData: ContextData = {
        selectedText: selectedText || '',
        timestamp: this.lastCaptureTime,
        source: 'clipboard'
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
   * Simulate copy keyboard shortcut based on platform
   */
  private async simulateCopy(): Promise<void> {
    try {
      // Try using robotjs if available
      const robot = await this.tryLoadRobotJS();
      if (robot) {
        const modifier = process.platform === 'darwin' ? 'cmd' : 'control';
        robot.keyTap('c', modifier);
        return;
      }
      
      // Fallback: Use native key simulation (platform-specific)
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
    try {
      // Dynamic import to avoid build errors if not installed
      const robot = require('robotjs');
      return robot;
    } catch {
      console.log('[context-menu] robotjs not available, using fallback');
      return null;
    }
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