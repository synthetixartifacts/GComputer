/**
 * View Manager Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  viewState,
  navigateToView,
  goBack,
  resetToMenu,
  showAlert,
  showError,
  showSuccess,
  showWarning,
  showInfo,
  cleanup,
  canGoBack,
  getCurrentView,
  getViewData
} from '../view-manager';

describe('View Manager', () => {
  beforeEach(() => {
    // Reset to initial state
    resetToMenu();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Navigation', () => {
    it('should navigate to a new view', () => {
      navigateToView('translate', { text: 'Hello' });
      
      const state = get(viewState);
      expect(state.currentView).toBe('translate');
      expect(state.viewData).toEqual({ text: 'Hello' });
      expect(state.previousView).toBe('menu');
      expect(state.transitionDirection).toBe('forward');
    });

    it('should go back to previous view', () => {
      navigateToView('translate');
      navigateToView('summary');
      
      goBack();
      
      const state = get(viewState);
      expect(state.currentView).toBe('translate');
      expect(state.transitionDirection).toBe('back');
    });

    it('should reset to menu', () => {
      navigateToView('translate');
      navigateToView('summary');
      
      resetToMenu();
      
      const state = get(viewState);
      expect(state.currentView).toBe('menu');
      expect(state.viewData).toBeNull();
      expect(state.previousView).toBeUndefined();
    });

    it('should check if can go back', () => {
      expect(canGoBack()).toBe(false);
      
      navigateToView('translate');
      expect(canGoBack()).toBe(true);
    });

    it('should get current view', () => {
      expect(getCurrentView()).toBe('menu');
      
      navigateToView('translate');
      expect(getCurrentView()).toBe('translate');
    });

    it('should get view data', () => {
      expect(getViewData()).toBeNull();
      
      navigateToView('translate', { text: 'Hello' });
      expect(getViewData()).toEqual({ text: 'Hello' });
    });
  });

  describe('Alert System', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should show alert and auto-dismiss', () => {
      showAlert({
        message: 'Test alert',
        type: 'info',
        duration: 2000
      });
      
      let state = get(viewState);
      expect(state.currentView).toBe('alert');
      expect(state.viewData?.message).toBe('Test alert');
      
      // Fast-forward time
      vi.advanceTimersByTime(2000);
      
      state = get(viewState);
      expect(state.currentView).toBe('menu');
    });

    it('should show error alert', () => {
      showError('Error message');
      
      const state = get(viewState);
      expect(state.currentView).toBe('alert');
      expect(state.viewData?.message).toBe('Error message');
      expect(state.viewData?.type).toBe('error');
    });

    it('should show success alert', () => {
      showSuccess('Success message');
      
      const state = get(viewState);
      expect(state.currentView).toBe('alert');
      expect(state.viewData?.message).toBe('Success message');
      expect(state.viewData?.type).toBe('success');
    });

    it('should show warning alert', () => {
      showWarning('Warning message');
      
      const state = get(viewState);
      expect(state.currentView).toBe('alert');
      expect(state.viewData?.message).toBe('Warning message');
      expect(state.viewData?.type).toBe('warning');
    });

    it('should show info alert', () => {
      showInfo('Info message');
      
      const state = get(viewState);
      expect(state.currentView).toBe('alert');
      expect(state.viewData?.message).toBe('Info message');
      expect(state.viewData?.type).toBe('info');
    });

    it('should execute callback on alert close', () => {
      const callback = vi.fn();
      
      showAlert({
        message: 'Test',
        duration: 1000,
        onClose: callback
      });
      
      vi.advanceTimersByTime(1000);
      
      expect(callback).toHaveBeenCalled();
    });

    it('should persist alert with duration 0', () => {
      showAlert({
        message: 'Persistent alert',
        duration: 0
      });
      
      vi.advanceTimersByTime(10000); // Advance 10 seconds
      
      const state = get(viewState);
      expect(state.currentView).toBe('alert'); // Still showing
    });
  });
});