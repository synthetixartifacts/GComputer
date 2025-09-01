/**
 * Context Menu Store Tests
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { get } from 'svelte/store';
import {
  contextMenuConfig,
  selectedText,
  contextMenuVisible,
  contextMenuLoading,
  contextMenuError,
  enabledActions,
  groupedActions,
  contextMenuStore,
  updateConfig,
  showMenu,
  hideMenu,
  setLoading,
  setError,
  executeAction
} from '../store';
import { DEFAULT_ACTIONS } from '../types';
import * as actionRegistry from '../actions/registry';

// Mock the action registry
vi.mock('../actions/registry', async () => {
  const actual = await vi.importActual('../actions/registry');
  return {
    ...actual,
    getAction: vi.fn()
  };
});

describe('Context Menu Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset stores to initial state
    contextMenuConfig.set({
      enabled: false,
      shortcut: 'Alt+Space',
      actions: DEFAULT_ACTIONS.map(a => a.id)
    });
    selectedText.set('');
    contextMenuVisible.set(false);
    contextMenuLoading.set(false);
    contextMenuError.set(null);
  });

  describe('Configuration Store', () => {
    it('should update configuration', () => {
      updateConfig({ enabled: true, shortcut: 'Ctrl+Space' });
      
      const config = get(contextMenuConfig);
      expect(config.enabled).toBe(true);
      expect(config.shortcut).toBe('Ctrl+Space');
    });

    it('should partial update configuration', () => {
      const initialConfig = get(contextMenuConfig);
      updateConfig({ enabled: true });
      
      const config = get(contextMenuConfig);
      expect(config.enabled).toBe(true);
      expect(config.shortcut).toBe(initialConfig.shortcut);
      expect(config.actions).toEqual(initialConfig.actions);
    });
  });

  describe('Menu Visibility', () => {
    it('should show menu with text', () => {
      showMenu('Selected text');
      
      expect(get(selectedText)).toBe('Selected text');
      expect(get(contextMenuVisible)).toBe(true);
      expect(get(contextMenuError)).toBeNull();
    });

    it('should show menu without text', () => {
      showMenu();
      
      expect(get(selectedText)).toBe('');
      expect(get(contextMenuVisible)).toBe(true);
      expect(get(contextMenuError)).toBeNull();
    });

    it('should hide menu and clear state', () => {
      showMenu('Text');
      setError('Some error');
      
      hideMenu();
      
      expect(get(contextMenuVisible)).toBe(false);
      expect(get(selectedText)).toBe('');
      expect(get(contextMenuError)).toBeNull();
    });
  });

  describe('Loading State', () => {
    it('should set loading state', () => {
      setLoading(true);
      expect(get(contextMenuLoading)).toBe(true);
      
      setLoading(false);
      expect(get(contextMenuLoading)).toBe(false);
    });
  });

  describe('Error State', () => {
    it('should set error message', () => {
      setError('Test error');
      expect(get(contextMenuError)).toBe('Test error');
    });

    it('should clear error', () => {
      setError('Test error');
      setError(null);
      expect(get(contextMenuError)).toBeNull();
    });
  });

  describe('Derived Stores', () => {
    describe('enabledActions', () => {
      it('should filter actions based on config', () => {
        updateConfig({ actions: ['translate'] });
        
        const actions = get(enabledActions);
        expect(actions).toHaveLength(1);
        expect(actions[0].id).toBe('translate');
      });

      it('should return empty array when no actions configured', () => {
        updateConfig({ actions: [] });
        
        const actions = get(enabledActions);
        expect(actions).toHaveLength(0);
      });
    });

    describe('groupedActions', () => {
      it('should group actions by category', () => {
        const groups = get(groupedActions);
        
        expect(groups).toHaveProperty('ai');
        expect(Array.isArray(groups.ai)).toBe(true);
        
        // Translate action should be in AI category
        const aiActions = groups.ai;
        const hasTranslate = aiActions.some(a => a.id === 'translate');
        expect(hasTranslate).toBe(true);
      });

      it('should handle actions without category', () => {
        // If any action doesn't have a category, it should go to 'other'
        const groups = get(groupedActions);
        
        // Check that all enabled actions are in some group
        const allGroupedActions = Object.values(groups).flat();
        const enabled = get(enabledActions);
        expect(allGroupedActions.length).toBe(enabled.length);
      });
    });

    describe('contextMenuStore', () => {
      it('should combine all state', () => {
        showMenu('Test text');
        setLoading(true);
        setError('Test error');
        
        const state = get(contextMenuStore);
        
        expect(state.selectedText).toBe('Test text');
        expect(state.isVisible).toBe(true);
        expect(state.loading).toBe(true);
        expect(state.error).toBe('Test error');
        expect(state.hasText).toBe(true);
        expect(state.currentView).toBe('menu');
      });

      it('should detect hasText correctly', () => {
        showMenu('');
        let state = get(contextMenuStore);
        expect(state.hasText).toBe(false);
        
        showMenu('Some text');
        state = get(contextMenuStore);
        expect(state.hasText).toBe(true);
      });
    });
  });

  describe('Execute Action', () => {
    it('should execute action successfully', async () => {
      const mockAction = {
        id: 'test',
        validate: vi.fn(() => true),
        execute: vi.fn(() => Promise.resolve({
          success: true,
          actionId: 'test',
          result: 'Success'
        }))
      };
      
      (actionRegistry.getAction as Mock).mockReturnValue(mockAction);
      selectedText.set('Test text');
      
      await executeAction('test');
      
      // Note: current implementation doesn't call validate separately
      expect(mockAction.execute).toHaveBeenCalledWith({
        selectedText: 'Test text',
        hasSelection: true
      });
      expect(get(contextMenuError)).toBeNull();
      expect(get(contextMenuLoading)).toBe(false);
    });

    it('should handle action not found', async () => {
      (actionRegistry.getAction as Mock).mockReturnValue(undefined);
      
      await executeAction('non-existent');
      
      expect(get(contextMenuError)).toBe('Unknown action: non-existent');
      expect(get(contextMenuLoading)).toBe(false);
    });

    it('should handle validation failure inside execute', async () => {
      const mockAction = {
        id: 'test',
        validate: vi.fn(() => false),
        execute: vi.fn(() => Promise.resolve({
          success: false,
          actionId: 'test',
          error: 'Validation failed'
        }))
      };
      
      (actionRegistry.getAction as Mock).mockReturnValue(mockAction);
      
      await executeAction('test');
      
      // Current implementation doesn't call validate separately
      expect(mockAction.execute).toHaveBeenCalled();
      expect(get(contextMenuError)).toBe('Validation failed');
    });

    it('should handle execution error', async () => {
      const mockAction = {
        id: 'test',
        validate: vi.fn(() => true),
        execute: vi.fn(() => Promise.resolve({
          success: false,
          actionId: 'test',
          error: 'Execution failed'
        }))
      };
      
      (actionRegistry.getAction as Mock).mockReturnValue(mockAction);
      
      await executeAction('test');
      
      expect(get(contextMenuError)).toBe('Execution failed');
      expect(get(contextMenuLoading)).toBe(false);
    });

    it('should handle execution exception', async () => {
      const mockAction = {
        id: 'test',
        validate: vi.fn(() => true),
        execute: vi.fn(() => Promise.reject(new Error('Exception')))
      };
      
      (actionRegistry.getAction as Mock).mockReturnValue(mockAction);
      
      await executeAction('test');
      
      expect(get(contextMenuError)).toBe('Exception');
      expect(get(contextMenuLoading)).toBe(false);
    });

    it('should set loading state during execution', async () => {
      const mockAction = {
        id: 'test',
        validate: vi.fn(() => true),
        execute: vi.fn(() => new Promise(resolve => {
          // Check loading state while promise is pending
          expect(get(contextMenuLoading)).toBe(true);
          resolve({
            success: true,
            actionId: 'test'
          });
        }))
      };
      
      (actionRegistry.getAction as Mock).mockReturnValue(mockAction);
      
      await executeAction('test');
      
      expect(get(contextMenuLoading)).toBe(false);
    });
  });
});