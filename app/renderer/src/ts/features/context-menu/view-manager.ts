/**
 * View Manager for Context Menu
 * Handles navigation between different views in the modal
 */

import { writable, get } from 'svelte/store';
import type { ViewType, ViewState, AlertConfig } from './types';

// View state store
export const viewState = writable<ViewState>({
  currentView: 'menu',
  viewData: null
});

// Alert queue for managing multiple alerts
const alertQueue: AlertConfig[] = [];
let alertTimer: NodeJS.Timeout | null = null;

/**
 * Navigate to a specific view
 */
export function navigateToView(
  view: ViewType, 
  data?: any, 
  direction: 'forward' | 'back' = 'forward'
): void {
  const current = get(viewState);
  
  viewState.set({
    currentView: view,
    previousView: current.currentView,
    viewData: data,
    transitionDirection: direction
  });
}

/**
 * Go back to previous view
 */
export function goBack(): void {
  const current = get(viewState);
  
  if (current.previousView) {
    navigateToView(current.previousView, null, 'back');
  } else {
    navigateToView('menu', null, 'back');
  }
}

/**
 * Reset to main menu
 */
export function resetToMenu(): void {
  viewState.set({
    currentView: 'menu',
    viewData: null
  });
}

/**
 * Show an alert with auto-dismiss
 */
export function showAlert(config: AlertConfig): void {
  const { duration = 2000, onClose } = config;
  
  // Clear any existing timer
  if (alertTimer) {
    clearTimeout(alertTimer);
    alertTimer = null;
  }
  
  // Navigate to alert view
  navigateToView('alert', config);
  
  // Auto-dismiss if duration is set
  if (duration > 0) {
    alertTimer = setTimeout(() => {
      // Execute callback if provided
      if (onClose) {
        onClose();
      }
      
      // Reset to menu or go back
      const current = get(viewState);
      if (current.previousView && current.previousView !== 'alert') {
        goBack();
      } else {
        resetToMenu();
      }
      
      alertTimer = null;
    }, duration);
  }
}

/**
 * Show error alert
 */
export function showError(message: string, duration?: number): void {
  showAlert({
    message,
    type: 'error',
    duration: duration || 3000
  });
}

/**
 * Show success alert
 */
export function showSuccess(message: string, duration?: number): void {
  showAlert({
    message,
    type: 'success',
    duration: duration || 2000
  });
}

/**
 * Show warning alert
 */
export function showWarning(message: string, duration?: number): void {
  showAlert({
    message,
    type: 'warning',
    duration: duration || 2500
  });
}

/**
 * Show info alert
 */
export function showInfo(message: string, duration?: number): void {
  showAlert({
    message,
    type: 'info',
    duration: duration || 2000
  });
}

/**
 * Clear alert timer on cleanup
 */
export function cleanup(): void {
  if (alertTimer) {
    clearTimeout(alertTimer);
    alertTimer = null;
  }
}

/**
 * Check if we can go back
 */
export function canGoBack(): boolean {
  const current = get(viewState);
  return current.previousView !== undefined && current.previousView !== null;
}

/**
 * Get current view type
 */
export function getCurrentView(): ViewType {
  return get(viewState).currentView;
}

/**
 * Get view data
 */
export function getViewData(): any {
  return get(viewState).viewData;
}