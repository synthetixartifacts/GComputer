// Main database module entry point
// Provides clean API for database operations and maintains backwards compatibility

// Export all types
export * from './types.js';

// Export services for direct access if needed
export * from './services/index.js';

// Export seeding functions
export { runDbMigrations, seedDefaultData } from './seeding.js';

// Export handler registration
export { registerDbHandlers } from './handlers/index.js';

// Legacy compatibility exports - maintain existing API
import { testService, providerService, modelService, agentService } from './services/index.js';
import { registerDbHandlers } from './handlers/index.js';

/**
 * Legacy function name for IPC registration
 * Maintains backwards compatibility with existing main.ts
 */
export function registerDbIpc(): void {
  registerDbHandlers();
}

// Legacy direct access to services for backwards compatibility
export const dbServices = {
  test: testService,
  provider: providerService,
  model: modelService,
  agent: agentService,
};