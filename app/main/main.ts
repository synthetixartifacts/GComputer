/**
 * Main Process Entry Point
 * Orchestrates application initialization and lifecycle
 */

import { app } from 'electron';
import { loadEnvironment } from './environment';
import { createMainWindow, setupWindowHandlers } from './window';
import { registerAllIpcHandlers } from './ipc';
import { initializeApplication } from './initialization';

// Load environment configuration
loadEnvironment();

// Set app name for proper userData directory
app.setName('GComputer');

/**
 * Application ready handler
 */
app.whenReady().then(async () => {
  // Register all IPC handlers
  registerAllIpcHandlers();
  
  // Initialize application features
  await initializeApplication();
  
  // Create main window
  await createMainWindow();
});

// Setup window lifecycle handlers
setupWindowHandlers();