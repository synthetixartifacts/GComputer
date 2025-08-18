/**
 * Database operations module - refactored for maintainability and scalability
 * 
 * This file now serves as a compatibility layer while the actual implementation
 * has been moved to a segmented architecture in ./db/ directory.
 * 
 * New architecture:
 * - ./db/types.ts: All type definitions
 * - ./db/services/: Business logic layer with base service and entity services
 * - ./db/handlers/: IPC handler registration
 * - ./db/seeding.ts: Database seeding operations
 * - ./db/index.ts: Main module entry point
 */

// Re-export everything from the new segmented architecture
export * from './db/index.js';