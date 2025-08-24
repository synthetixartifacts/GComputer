/**
 * Context Menu Service
 * Business logic for context menu operations
 */

import type { 
  ContextMenuAction, 
  ActionExecutionResult, 
  AIActionOptions,
  ActionHandler,
  ActionHandlerMap 
} from './types';
import { getActionById, actionPrompts, canExecuteAction } from './actions';
import { aiCommunicationService } from '@features/ai-communication/service';

class ContextMenuService {
  private actionHandlers: ActionHandlerMap = {};
  
  constructor() {
    this.registerDefaultHandlers();
  }

  /**
   * Register default action handlers
   */
  private registerDefaultHandlers(): void {
    // AI-powered text actions
    this.registerHandler('translate', this.handleTranslate.bind(this));
    this.registerHandler('fix-grammar', this.handleGrammarFix.bind(this));
    this.registerHandler('summarize', this.handleSummarize.bind(this));
    this.registerHandler('explain', this.handleExplain.bind(this));
    
    // Utility actions
    this.registerHandler('screenshot', this.handleScreenshot.bind(this));
    this.registerHandler('copy', this.handleCopy.bind(this));
    this.registerHandler('paste', this.handlePaste.bind(this));
  }

  /**
   * Register a custom action handler
   */
  registerHandler(actionId: string, handler: ActionHandler): void {
    this.actionHandlers[actionId] = handler;
  }

  /**
   * Get selected text from the active application
   */
  async getSelectedText(): Promise<string> {
    try {
      if (!window.gc?.context) {
        throw new Error('Context API not available');
      }
      
      const result = await window.gc.context.getSelected();
      if (result.success && result.text) {
        return result.text;
      }
      
      return '';
    } catch (error) {
      console.error('Error getting selected text:', error);
      return '';
    }
  }

  /**
   * Execute a context menu action
   */
  async executeAction(
    actionId: string, 
    text: string = '', 
    options?: AIActionOptions
  ): Promise<ActionExecutionResult> {
    try {
      // Validate action can be executed
      const hasText = text.length > 0;
      if (!canExecuteAction(actionId, hasText)) {
        return {
          success: false,
          actionId,
          error: 'Action cannot be executed'
        };
      }
      
      // Get the handler for this action
      const handler = this.actionHandlers[actionId];
      if (!handler) {
        return {
          success: false,
          actionId,
          error: `No handler registered for action: ${actionId}`
        };
      }
      
      // Execute the action
      return await handler(text, options);
      
    } catch (error) {
      console.error(`Error executing action ${actionId}:`, error);
      return {
        success: false,
        actionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Show the context menu overlay
   */
  async showMenu(position?: { x: number; y: number }): Promise<void> {
    if (!window.gc?.context) {
      throw new Error('Context API not available');
    }
    
    await window.gc.context.showMenu(position);
  }

  /**
   * Hide the context menu overlay
   */
  async hideMenu(): Promise<void> {
    if (!window.gc?.context) {
      throw new Error('Context API not available');
    }
    
    await window.gc.context.hideMenu();
  }

  // Action Handlers

  private async handleTranslate(text: string, options?: AIActionOptions): Promise<ActionExecutionResult> {
    try {
      const prompt = actionPrompts['translate'] + text;
      
      // TODO: Get the correct agent ID for translation
      // For now, use a placeholder agent ID
      const agentId = 1; // This should be fetched from admin/agents
      
      const response = await aiCommunicationService.sendMessageToAgent(
        agentId,
        prompt,
        { temperature: 0.3, ...options }
      );
      
      return {
        success: true,
        actionId: 'translate',
        result: response.content
      };
    } catch (error) {
      return {
        success: false,
        actionId: 'translate',
        error: error instanceof Error ? error.message : 'Translation failed'
      };
    }
  }

  private async handleGrammarFix(text: string, options?: AIActionOptions): Promise<ActionExecutionResult> {
    try {
      const prompt = actionPrompts['fix-grammar'] + text;
      
      const agentId = 1; // TODO: Get grammar agent ID
      
      const response = await aiCommunicationService.sendMessageToAgent(
        agentId,
        prompt,
        { temperature: 0.2, ...options }
      );
      
      return {
        success: true,
        actionId: 'fix-grammar',
        result: response.content
      };
    } catch (error) {
      return {
        success: false,
        actionId: 'fix-grammar',
        error: error instanceof Error ? error.message : 'Grammar fix failed'
      };
    }
  }

  private async handleSummarize(text: string, options?: AIActionOptions): Promise<ActionExecutionResult> {
    try {
      const prompt = actionPrompts['summarize'] + text;
      
      const agentId = 1; // TODO: Get summary agent ID
      
      const response = await aiCommunicationService.sendMessageToAgent(
        agentId,
        prompt,
        { temperature: 0.5, ...options }
      );
      
      return {
        success: true,
        actionId: 'summarize',
        result: response.content
      };
    } catch (error) {
      return {
        success: false,
        actionId: 'summarize',
        error: error instanceof Error ? error.message : 'Summarization failed'
      };
    }
  }

  private async handleExplain(text: string, options?: AIActionOptions): Promise<ActionExecutionResult> {
    try {
      const prompt = actionPrompts['explain'] + text;
      
      const agentId = 1; // TODO: Get explanation agent ID
      
      const response = await aiCommunicationService.sendMessageToAgent(
        agentId,
        prompt,
        { temperature: 0.7, ...options }
      );
      
      return {
        success: true,
        actionId: 'explain',
        result: response.content
      };
    } catch (error) {
      return {
        success: false,
        actionId: 'explain',
        error: error instanceof Error ? error.message : 'Explanation failed'
      };
    }
  }

  private async handleScreenshot(_text: string, _options?: AIActionOptions): Promise<ActionExecutionResult> {
    try {
      if (!window.gc?.screen) {
        throw new Error('Screen API not available');
      }
      
      const result = await window.gc.screen.capture();
      
      return {
        success: true,
        actionId: 'screenshot',
        result: 'Screenshot captured',
        metadata: { path: result }
      };
    } catch (error) {
      return {
        success: false,
        actionId: 'screenshot',
        error: error instanceof Error ? error.message : 'Screenshot failed'
      };
    }
  }

  private async handleCopy(text: string, _options?: AIActionOptions): Promise<ActionExecutionResult> {
    try {
      if (!window.gc?.context) {
        throw new Error('Context API not available');
      }
      
      await window.gc.context.setClipboard(text);
      
      return {
        success: true,
        actionId: 'copy',
        result: 'Text copied to clipboard'
      };
    } catch (error) {
      return {
        success: false,
        actionId: 'copy',
        error: error instanceof Error ? error.message : 'Copy failed'
      };
    }
  }

  private async handlePaste(_text: string, _options?: AIActionOptions): Promise<ActionExecutionResult> {
    try {
      if (!window.gc?.context) {
        throw new Error('Context API not available');
      }
      
      const result = await window.gc.context.getClipboard();
      
      return {
        success: true,
        actionId: 'paste',
        result: result.text || ''
      };
    } catch (error) {
      return {
        success: false,
        actionId: 'paste',
        error: error instanceof Error ? error.message : 'Paste failed'
      };
    }
  }

  /**
   * Get current shortcut configuration
   */
  async getShortcuts(): Promise<{ primary: string; secondary?: string } | null> {
    try {
      if (!window.gc?.context) {
        return null;
      }
      
      const result = await window.gc.context.getShortcuts();
      return result.success ? result.shortcuts || null : null;
    } catch (error) {
      console.error('Error getting shortcuts:', error);
      return null;
    }
  }

  /**
   * Update shortcut configuration
   */
  async updateShortcuts(shortcuts: { primary?: string; secondary?: string }): Promise<boolean> {
    try {
      if (!window.gc?.context) {
        return false;
      }
      
      const result = await window.gc.context.updateShortcuts(shortcuts);
      return result.success;
    } catch (error) {
      console.error('Error updating shortcuts:', error);
      return false;
    }
  }
}

// Export singleton instance
export const contextMenuService = new ContextMenuService();