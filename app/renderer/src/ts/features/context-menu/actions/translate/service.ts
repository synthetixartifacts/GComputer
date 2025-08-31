/**
 * Translate Action Service
 * Handles text translation and replacement logic
 */

import { AbstractAction } from '../base-action';
import type { ActionContext, ActionExecutionResult } from '../../types';
import { showError } from '../../view-manager';
import { isElectronEnvironment } from '@features/environment/service';

export class TranslateAction extends AbstractAction {
  id = 'translate';
  name = 'Translate';
  description = 'Translate selected text';
  
  validate(context: ActionContext): boolean {
    return context.hasSelection && context.selectedText.trim().length > 0;
  }
  
  async execute(context: ActionContext): Promise<ActionExecutionResult> {
    console.log('[Translate Action] Executing with context:', context);
    
    try {
      // Check if text is selected
      if (!this.validate(context)) {
        console.log('[Translate Action] No text selected');
        // Show "No text selected" alert for 2 seconds
        showError('No text selected', 2000);
        
        // After alert, close the popup
        setTimeout(() => {
          this.closeContextMenu();
        }, 2000);
        
        return this.error('No text selected');
      }
      
      // For now, replace with "Hello World" as POC
      const replacementText = 'Hello World';
      console.log('[Translate Action] Replacing text with:', replacementText);
      
      // Replace the selected text
      const replaced = await this.replaceSelectedText(replacementText);
      console.log('[Translate Action] Replacement result:', replaced);
      
      if (replaced) {
        // Close the context menu after successful replacement
        await this.closeContextMenu();
        
        return this.success(replacementText);
      } else {
        showError('Failed to replace text', 3000);
        return this.error('Failed to replace text');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Translation failed';
      showError(errorMessage, 3000);
      return this.error(errorMessage);
    }
  }
  
  /**
   * Replace selected text in the active application
   */
  private async replaceSelectedText(newText: string): Promise<boolean> {
    if (!isElectronEnvironment() || !window.gc?.context) {
      console.warn('[Translate Action] Context API not available');
      return false;
    }
    
    console.log('[Translate Action] Calling replaceSelected API with:', newText);
    
    try {
      // Call the Electron API to replace selected text
      const result = await window.gc.context.replaceSelected(newText);
      return result.success;
    } catch (error) {
      console.error('Failed to replace selected text:', error);
      return false;
    }
  }
  
  /**
   * Close the context menu
   */
  private async closeContextMenu(): Promise<void> {
    if (!isElectronEnvironment() || !window.gc?.context) {
      // If not in Electron, try closing the window
      if (window.opener === null) {
        window.close();
      }
      return;
    }
    
    try {
      await window.gc.context.hideMenu();
    } catch (error) {
      console.error('Failed to hide context menu:', error);
    }
  }
  
  getUIConfig() {
    return {
      icon: '🌐',
      label: 'contextMenu.actions.translate',
      requiresText: true,
      category: 'ai',
      shortcut: 'T'
    };
  }
}

// Export singleton instance
export const translateAction = new TranslateAction();