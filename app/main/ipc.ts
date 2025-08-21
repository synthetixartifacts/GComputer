/**
 * IPC Registration Module
 * Central registration of all IPC handlers
 */

import { registerSettingsIpc } from './settings';
import { registerFsIpc } from './fs';
import { registerDbIpc } from './db';
import { registerScreenCaptureIpc } from './screen-capture';
import { initializeDisplayMedia, cleanupDisplayMedia } from './display-media';

/**
 * Register all IPC handlers
 */
export function registerAllIpcHandlers(): void {
  console.log('[ipc] Registering IPC handlers...');
  
  // Register feature-specific IPC handlers
  registerSettingsIpc();
  registerFsIpc();
  registerDbIpc();
  registerScreenCaptureIpc();
  
  // Initialize display media handling
  initializeDisplayMedia();
  
  console.log('[ipc] IPC handlers registered successfully');
}

/**
 * Clean up all IPC handlers
 */
export function cleanupAllIpcHandlers(): void {
  console.log('[ipc] Cleaning up IPC handlers...');
  
  // Clean up display media handlers
  cleanupDisplayMedia();
  
  // Additional cleanup can be added here for other modules
  console.log('[ipc] IPC handlers cleaned up');
}