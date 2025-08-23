/**
 * Shared type definitions for preload API
 * Import these types from main process to ensure consistency
 */

// Re-export types from main process to ensure consistency
export type { AppSettings, ThemeMode, Locale } from '../main/settings';

// Database types should be imported from the source of truth
export type {
  TestFilters,
  TestInsert,
  TestUpdate,
  ProviderFilters,
  ProviderInsert,
  ProviderUpdate,
  ModelFilters,
  ModelInsert,
  ModelUpdate,
  AgentFilters,
  AgentInsert,
  AgentUpdate,
} from '../main/db/types';

// Screen capture types
export interface CaptureOptions {
  sourceId?: string;
  savePath?: string;
}

// File system types
export interface FsListedItem {
  name: string;
  absolutePath: string;
  relativePath: string;
  sizeBytes: number;
  lastModified: number;
}