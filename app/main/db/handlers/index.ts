import { registerTestHandlers } from './test-handlers.js';
import { registerAdminHandlers } from './admin-handlers.js';

/**
 * Register all database IPC handlers
 */
export function registerDbHandlers(): void {
  registerTestHandlers();
  registerAdminHandlers();
}

// Export individual registration functions for granular control
export { registerTestHandlers } from './test-handlers.js';
export { registerAdminHandlers } from './admin-handlers.js';