/**
 * Screenshot management service for listing and managing saved screenshots
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { nativeImage } from 'electron';
import { getScreenshotsDir } from './utils.js';
import type { Screenshot } from './types.js';

/**
 * Ensure screenshots directory exists
 */
async function ensureScreenshotsDir(customPath?: string): Promise<void> {
  const dir = getScreenshotsDir(customPath);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * List all screenshots
 */
export async function listScreenshots(customPath?: string): Promise<Screenshot[]> {
  await ensureScreenshotsDir(customPath);
  const dir = getScreenshotsDir(customPath);
  
  try {
    const files = await fs.readdir(dir);
    const screenshots: Screenshot[] = [];
    
    for (const file of files) {
      if (file.startsWith('ps_') && file.endsWith('.png')) {
        const filepath = path.join(dir, file);
        const stats = await fs.stat(filepath);
        
        const buffer = await fs.readFile(filepath);
        const image = nativeImage.createFromBuffer(buffer);
        const size = image.getSize();
        
        screenshots.push({
          id: file.replace('.png', ''),
          filename: file,
          path: filepath,
          size: stats.size,
          createdAt: stats.birthtimeMs,
          width: size.width,
          height: size.height
        });
      }
    }
    
    return screenshots.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error listing screenshots:', error);
    return [];
  }
}

/**
 * Delete a screenshot
 */
export async function deleteScreenshot(filename: string, customPath?: string): Promise<boolean> {
  try {
    const filepath = path.join(getScreenshotsDir(customPath), filename);
    await fs.unlink(filepath);
    return true;
  } catch (error) {
    console.error('Error deleting screenshot:', error);
    return false;
  }
}

/**
 * Get a single screenshot as base64
 */
export async function getScreenshot(filename: string, customPath?: string): Promise<string | null> {
  try {
    const filepath = path.join(getScreenshotsDir(customPath), filename);
    const buffer = await fs.readFile(filepath);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error('Error reading screenshot:', error);
    return null;
  }
}