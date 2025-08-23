/**
 * Utility functions for screen capture
 */

import path from 'node:path';
import { app } from 'electron';

/**
 * Check if we're in development mode
 */
export function isDevMode(): boolean {
  return process.env.mode === 'development' || process.env.VITE_DEV_SERVER_URL !== undefined;
}

/**
 * Sanitize path to prevent directory traversal
 */
export function sanitizePath(customPath: string, baseDir: string): string {
  const resolved = path.resolve(baseDir, customPath);
  const normalizedBase = path.resolve(baseDir);
  
  // Ensure the resolved path is within the base directory
  if (!resolved.startsWith(normalizedBase)) {
    throw new Error('Invalid path: attempted directory traversal');
  }
  
  return resolved;
}

/**
 * Get screenshots directory path
 */
export function getScreenshotsDir(customPath?: string): string {
  if (customPath) {
    // Get the allowed base directory
    const baseDir = isDevMode() 
      ? path.join(__dirname, '..', '..', '..')
      : app.getPath('userData');
    
    // Sanitize the custom path
    try {
      return sanitizePath(customPath, baseDir);
    } catch (error) {
      console.error('[Screen Capture] Invalid custom path:', error);
      // Fall back to default on invalid path
    }
  }
  
  // In dev mode, save to local project folder
  if (isDevMode()) {
    const projectRoot = path.join(__dirname, '..', '..', '..');
    return path.join(projectRoot, 'screenshots');
  }
  
  // In production, use userData
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'assets', 'screenshots');
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `ps_${year}${month}${day}_${hours}${minutes}${seconds}.png`;
}