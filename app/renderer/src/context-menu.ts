/**
 * Context Menu Entry Point
 * Initializes the context menu overlay window
 */

import './styles/global.scss';
import ContextMenuOverlay from './views/ContextMenuOverlay.svelte';

// Initialize the context menu overlay
const app = new ContextMenuOverlay({
  target: document.getElementById('app')!,
});

// Handle window ready
window.addEventListener('DOMContentLoaded', () => {
  console.log('[context-menu] Overlay window ready');
  
  // Focus the app for keyboard navigation
  document.body.focus();
});

// Handle window close
window.addEventListener('beforeunload', () => {
  console.log('[context-menu] Overlay window closing');
});

export default app;