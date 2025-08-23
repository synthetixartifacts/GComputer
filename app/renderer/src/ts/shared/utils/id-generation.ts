/**
 * Centralized ID generation utilities
 * Provides consistent ID generation across the application
 */

/**
 * Generate a unique ID with optional prefix
 * @param prefix - Optional prefix for the ID
 * @returns Unique string ID
 */
export function generateId(prefix: string = 'id'): string {
  const random = Math.random().toString(36).slice(2, 8);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Generate a timestamp-based ID
 * @returns Timestamp-based ID string
 */
export function generateTimestampId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Generate a short random ID (6 characters)
 * @returns Short random ID
 */
export function generateShortId(): string {
  return Math.random().toString(36).slice(2, 8);
}

/**
 * Generate UUID v4
 * @returns UUID string
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}