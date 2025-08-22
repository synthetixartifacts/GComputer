import { registerTestHandlers } from './test-handlers.js';
import { registerAdminHandlers } from './admin-handlers.js';
import { registerDiscussionHandlers } from './discussion-handlers.js';
import { registerMessageHandlers } from './message-handlers.js';

/**
 * Register all database IPC handlers
 */
export function registerDbHandlers(): void {
  registerTestHandlers();
  registerAdminHandlers();
  registerDiscussionHandlers();
  registerMessageHandlers();
}

// Export individual registration functions for granular control
export { registerTestHandlers } from './test-handlers.js';
export { registerAdminHandlers } from './admin-handlers.js';
export { registerDiscussionHandlers } from './discussion-handlers.js';
export { registerMessageHandlers } from './message-handlers.js';