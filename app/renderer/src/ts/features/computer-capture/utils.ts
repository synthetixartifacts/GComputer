/**
 * Utility functions for screen capture feature
 * Following DRY principles for reusable functionality
 */

import type { Screenshot } from './types';

/**
 * Format file size for human-readable display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format timestamp as relative time
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  
  return date.toLocaleDateString();
}

/**
 * Generate a unique screenshot filename
 */
export function generateScreenshotFilename(prefix: string = 'screenshot'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  
  return `${prefix}_${year}${month}${day}_${hours}${minutes}${seconds}_${ms}.png`;
}

/**
 * Sort screenshots by date (newest first)
 */
export function sortScreenshotsByDate(screenshots: Screenshot[]): Screenshot[] {
  return [...screenshots].sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Filter screenshots by date range
 */
export function filterScreenshotsByDateRange(
  screenshots: Screenshot[],
  startDate?: Date,
  endDate?: Date
): Screenshot[] {
  return screenshots.filter(screenshot => {
    const date = new Date(screenshot.createdAt);
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  });
}

/**
 * Group screenshots by date
 */
export function groupScreenshotsByDate(screenshots: Screenshot[]): Map<string, Screenshot[]> {
  const groups = new Map<string, Screenshot[]>();
  
  screenshots.forEach(screenshot => {
    const date = new Date(screenshot.createdAt);
    const key = date.toLocaleDateString();
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(screenshot);
  });
  
  return groups;
}

/**
 * Calculate total storage used by screenshots
 */
export function calculateTotalStorage(screenshots: Screenshot[]): number {
  return screenshots.reduce((total, screenshot) => total + screenshot.size, 0);
}

/**
 * Validate screenshot data
 */
export function isValidScreenshot(data: any): data is Screenshot {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.filename === 'string' &&
    typeof data.path === 'string' &&
    typeof data.size === 'number' &&
    typeof data.createdAt === 'number' &&
    typeof data.width === 'number' &&
    typeof data.height === 'number'
  );
}

/**
 * Extract image dimensions from data URL
 */
export async function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Convert data URL to Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

/**
 * Download screenshot to user's device
 */
export function downloadScreenshot(screenshot: Screenshot, dataUrl: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = screenshot.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copy image to clipboard (requires Clipboard API)
 */
export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    const blob = dataUrlToBlob(dataUrl);
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (error) {
    console.error('Failed to copy image to clipboard:', error);
    return false;
  }
}