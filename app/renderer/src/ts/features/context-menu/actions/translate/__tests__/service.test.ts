/**
 * Translate Action Tests
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { translateAction } from '../service';
import * as viewManager from '../../../view-manager';
import * as envService from '@features/environment/service';

// Mock the modules
vi.mock('../../../view-manager', () => ({
  showError: vi.fn(),
  showAlert: vi.fn()
}));

vi.mock('@features/environment/service', () => ({
  isElectronEnvironment: vi.fn(() => true)
}));

// Mock window.gc
const mockReplaceSelected = vi.fn();
const mockHideMenu = vi.fn();

describe('Translate Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup window.gc mock
    (global as any).window = {
      gc: {
        context: {
          replaceSelected: mockReplaceSelected,
          hideMenu: mockHideMenu
        }
      },
      close: vi.fn(),
      opener: null
    };
    
    // Reset mock implementations
    mockReplaceSelected.mockResolvedValue({ success: true });
    mockHideMenu.mockResolvedValue({ success: true });
  });

  describe('Basic Properties', () => {
    it('should have correct ID and name', () => {
      expect(translateAction.id).toBe('translate');
      expect(translateAction.name).toBe('Translate');
      expect(translateAction.description).toBe('Translate selected text');
    });

    it('should have correct UI config', () => {
      const config = translateAction.getUIConfig();
      expect(config).toEqual({
        icon: '🌐',
        label: 'contextMenu.actions.translate',
        requiresText: true,
        category: 'ai',
        shortcut: 'T'
      });
    });
  });

  describe('Validation', () => {
    it('should validate when text is selected', () => {
      const context = {
        selectedText: 'Hello world',
        hasSelection: true
      };
      
      expect(translateAction.validate(context)).toBe(true);
    });

    it('should not validate when no text is selected', () => {
      const context = {
        selectedText: '',
        hasSelection: false
      };
      
      expect(translateAction.validate(context)).toBe(false);
    });

    it('should not validate when text is only whitespace', () => {
      const context = {
        selectedText: '   ',
        hasSelection: true
      };
      
      expect(translateAction.validate(context)).toBe(false);
    });
  });

  describe('Execution', () => {
    it('should replace selected text with "Hello World"', async () => {
      const context = {
        selectedText: 'Some text',
        hasSelection: true
      };
      
      const result = await translateAction.execute(context);
      
      expect(mockReplaceSelected).toHaveBeenCalledWith('Hello World');
      expect(mockHideMenu).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        actionId: 'translate',
        result: 'Hello World'
      });
    });

    it('should show error when no text is selected', async () => {
      const context = {
        selectedText: '',
        hasSelection: false
      };
      
      const result = await translateAction.execute(context);
      
      expect(viewManager.showError).toHaveBeenCalledWith('No text selected', 2000);
      expect(mockReplaceSelected).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        actionId: 'translate',
        error: 'No text selected'
      });
    });

    it('should handle replacement failure', async () => {
      mockReplaceSelected.mockResolvedValue({ success: false });
      
      const context = {
        selectedText: 'Some text',
        hasSelection: true
      };
      
      const result = await translateAction.execute(context);
      
      expect(mockReplaceSelected).toHaveBeenCalled();
      expect(viewManager.showError).toHaveBeenCalledWith('Failed to replace text', 3000);
      expect(result).toEqual({
        success: false,
        actionId: 'translate',
        error: 'Failed to replace text'
      });
    });

    it('should handle API errors gracefully', async () => {
      // When replaceSelected rejects, replaceSelectedText catches it and returns false
      mockReplaceSelected.mockRejectedValue(new Error('API Error'));
      
      const context = {
        selectedText: 'Some text',
        hasSelection: true
      };
      
      const result = await translateAction.execute(context);
      
      // The error is caught in replaceSelectedText which returns false
      // So we get the generic "Failed to replace text" message
      expect(viewManager.showError).toHaveBeenCalledWith('Failed to replace text', 3000);
      expect(result).toEqual({
        success: false,
        actionId: 'translate',
        error: 'Failed to replace text'
      });
    });

    it('should close window after error alert in non-Electron', async () => {
      vi.useFakeTimers();
      (envService.isElectronEnvironment as Mock).mockReturnValue(false);
      
      const context = {
        selectedText: '',
        hasSelection: false
      };
      
      await translateAction.execute(context);
      
      // Fast-forward 2 seconds
      vi.advanceTimersByTime(2000);
      
      expect(window.close).toHaveBeenCalled();
      
      vi.useRealTimers();
    });
  });

  describe('Non-Electron Environment', () => {
    beforeEach(() => {
      (envService.isElectronEnvironment as Mock).mockReturnValue(false);
      (global as any).window.gc = undefined;
    });

    it('should handle missing context API', async () => {
      const context = {
        selectedText: 'Some text',
        hasSelection: true
      };
      
      const result = await translateAction.execute(context);
      
      expect(viewManager.showError).toHaveBeenCalledWith('Failed to replace text', 3000);
      expect(result.success).toBe(false);
    });
  });
});