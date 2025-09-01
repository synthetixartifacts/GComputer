/**
 * Preload Script - Security Bridge
 * Exposes safe APIs from main process to renderer through window.gc
 * 
 * SECURITY PRINCIPLES:
 * - Never expose Node.js or Electron modules directly
 * - Always validate inputs before IPC calls
 * - Use typed interfaces for all exposed APIs
 * - Maintain strict separation between processes
 */

import { contextBridge } from 'electron';
import { settingsApi } from './api/settings';
import { configApi } from './api/config';
import { fsApi } from './api/fs';
import { screenApi } from './api/screen';
import { testApi, adminApi, discussionsApi, messagesApi } from './api/db';
import { contextApi } from './api/context';
import { ttsApi } from './api/tts';
import { sttApi } from './api/stt';
import { visionApi } from './api/vision';

/**
 * Main API object exposed to renderer process
 * All system operations must go through this controlled interface
 */
const gcApi = {
  // Core settings management
  settings: settingsApi,
  
  // Configuration and secrets
  config: configApi,
  
  // File system operations
  fs: fsApi,
  
  // Screen capture functionality
  screen: screenApi,
  
  // Context menu functionality
  context: contextApi,
  
  // Database operations
  db: {
    test: testApi,
    admin: adminApi,
    discussions: discussionsApi,
    messages: messagesApi,
  },
  
  // AI features
  tts: ttsApi,
  stt: sttApi,
  vision: visionApi,
};

// Expose the API to the renderer process in a secure way
contextBridge.exposeInMainWorld('gc', gcApi);

// Export types for TypeScript support
export type GCApi = typeof gcApi;
export {};