/**
 * Common formatting utilities
 * Centralizes formatting logic used across the application
 */

import { get } from 'svelte/store';
import { t } from '@renderer/ts/i18n/store';

/**
 * Format bytes to human-readable size
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.23 MB")
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return `0 ${get(t)('common.fileSize.bytes')}`;
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizeKeys = ['bytes', 'kb', 'mb', 'gb', 'tb'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const sizeUnit = get(t)(`common.fileSize.${sizeKeys[i]}`);
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizeUnit;
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param date - Date to format
 * @returns Relative time string
 */
export function getRelativeTime(date: Date | string | number): string {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (seconds < 60) return get(t)('common.time.justNow');
  if (seconds < 3600) return `${Math.floor(seconds / 60)} ${get(t)('common.time.minutesAgo')}`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ${get(t)('common.time.hoursAgo')}`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} ${get(t)('common.time.daysAgo')}`;
  
  return past.toLocaleDateString();
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 * @param date - Date to format
 * @returns ISO date string
 */
export function formatISODate(date: Date | string): string {
  return new Date(date).toISOString().slice(0, 10);
}

/**
 * Get current ISO timestamp
 * @returns ISO timestamp string
 */
export function nowIso(): string {
  return new Date().toISOString();
}