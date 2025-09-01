/**
 * Action Registry Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerAction,
  getAction,
  getAllActions,
  hasAction,
  initializeActions
} from '../registry';
import type { BaseAction } from '../base-action';
import type { ActionContext, ActionExecutionResult } from '../../types';

// Mock action for testing
class MockAction implements BaseAction {
  id = 'mock-action';
  name = 'Mock Action';
  
  validate(context: ActionContext): boolean {
    return context.hasSelection;
  }
  
  async execute(context: ActionContext): Promise<ActionExecutionResult> {
    return {
      success: true,
      actionId: this.id,
      result: `Executed with: ${context.selectedText}`
    };
  }
}

describe('Action Registry', () => {
  beforeEach(() => {
    // Registry is already initialized with translate action
    // Reset if needed for isolated tests
  });

  describe('Registration', () => {
    it('should register a new action', () => {
      const mockAction = new MockAction();
      registerAction(mockAction);
      
      expect(hasAction('mock-action')).toBe(true);
      expect(getAction('mock-action')).toBe(mockAction);
    });

    it('should overwrite existing action with same ID', () => {
      const firstAction = new MockAction();
      const secondAction = new MockAction();
      secondAction.name = 'Updated Mock Action';
      
      registerAction(firstAction);
      registerAction(secondAction);
      
      const retrieved = getAction('mock-action');
      expect(retrieved).toBe(secondAction);
      expect(retrieved?.name).toBe('Updated Mock Action');
    });
  });

  describe('Retrieval', () => {
    it('should get action by ID', () => {
      const action = getAction('translate');
      expect(action).toBeDefined();
      expect(action?.id).toBe('translate');
    });

    it('should return undefined for non-existent action', () => {
      const action = getAction('non-existent');
      expect(action).toBeUndefined();
    });

    it('should get all registered actions', () => {
      const actions = getAllActions();
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
      
      // Should include translate action
      const hasTranslate = actions.some(a => a.id === 'translate');
      expect(hasTranslate).toBe(true);
    });
  });

  describe('Existence Check', () => {
    it('should check if action exists', () => {
      expect(hasAction('translate')).toBe(true);
      expect(hasAction('non-existent')).toBe(false);
    });
  });

  describe('Initialization', () => {
    it('should have translate action after initialization', () => {
      // Already initialized on module load
      expect(hasAction('translate')).toBe(true);
      
      const translateAction = getAction('translate');
      expect(translateAction).toBeDefined();
      expect(translateAction?.name).toBe('Translate');
    });

    it('should be idempotent', () => {
      const actionsBefore = getAllActions().length;
      initializeActions();
      const actionsAfter = getAllActions().length;
      
      // Should not duplicate actions
      expect(actionsAfter).toBe(actionsBefore);
    });
  });
});