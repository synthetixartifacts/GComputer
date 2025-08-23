/**
 * Common validation utilities
 * Centralizes validation logic used across the application
 */

/**
 * Validate display ID format
 * @param displayId - Display ID to validate
 * @returns True if valid
 */
export function isValidDisplayId(displayId: string): boolean {
  return /^display_\d+$/.test(displayId);
}

/**
 * Validate provider code format (alphanumeric with dash/underscore)
 * @param code - Provider code to validate
 * @returns True if valid
 */
export function isValidProviderCode(code: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(code);
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns True if valid
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate URL format
 * @param url - URL to validate
 * @returns True if valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if value is non-empty string
 * @param value - Value to check
 * @returns True if non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if value is positive number
 * @param value - Value to check
 * @returns True if positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0;
}