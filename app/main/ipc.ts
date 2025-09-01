/**
 * IPC Registration Module
 * Central registration of all IPC handlers
 */

import { registerSettingsIpc } from './settings';
import { registerConfigIpc } from './config-ipc';
import { registerFsIpc } from './fs';
import { registerDbIpc } from './db';
import { registerScreenCaptureIpc } from './screen-capture/index';
import { initializeDisplayMedia, cleanupDisplayMedia } from './display-media';
import { initializeContextMenu, cleanupContextMenu } from './context-menu/index';

/**
 * Register all IPC handlers
 */
export async function registerAllIpcHandlers(): Promise<void> {
  console.log('[ipc] Registering IPC handlers...');
  
  // Register feature-specific IPC handlers
  registerSettingsIpc();
  registerConfigIpc();
  registerFsIpc();
  registerDbIpc();
  registerScreenCaptureIpc();
  
  // Initialize display media handling
  initializeDisplayMedia();
  
  // Initialize context menu system
  await initializeContextMenu();
  
  console.log('[ipc] IPC handlers registered successfully');
}

/**
 * Clean up all IPC handlers
 */
export function cleanupAllIpcHandlers(): void {
  console.log('[ipc] Cleaning up IPC handlers...');
  
  // Clean up display media handlers
  cleanupDisplayMedia();
  
  // Clean up context menu system
  cleanupContextMenu();
  
  // Additional cleanup can be added here for other modules
  console.log('[ipc] IPC handlers cleaned up');
}