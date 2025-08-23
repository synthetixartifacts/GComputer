/**
 * Screen capture service for taking screenshots
 */

import { desktopCapturer, screen } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getScreenshotsDir, generateFilename } from './utils.js';
import type { Screenshot, CaptureOptions } from './types.js';

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
 * Simple native Electron screen capture
 */
export async function captureScreen(options?: CaptureOptions): Promise<Screenshot> {
  console.log('[Screen Capture] Using native Electron desktopCapturer');
  
  try {
    // Get sources with maximum quality
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { 
        width: 3840,  // 4K width
        height: 2160  // 4K height
      }
    });
    
    console.log(`[Screen Capture] Found ${sources.length} sources`);
    
    if (sources.length === 0) {
      throw new Error('No screen sources available');
    }
    
    // Find the requested source or use the first one
    let source = sources[0];
    if (options?.sourceId) {
      const found = sources.find(s => s.id === options.sourceId);
      if (found) source = found;
    }
    
    console.log(`[Screen Capture] Using source: ${source.name} (${source.id})`);
    
    const image = source.thumbnail;
    if (!image || image.isEmpty()) {
      throw new Error('Captured image is empty');
    }
    
    // Get the actual size of the captured image
    const size = image.getSize();
    console.log(`[Screen Capture] Image size: ${size.width}x${size.height}`);
    
    // Convert to PNG
    const buffer = image.toPNG();
    
    // Save the screenshot
    await ensureScreenshotsDir(options?.savePath);
    const filename = generateFilename();
    const filepath = path.join(getScreenshotsDir(options?.savePath), filename);
    
    await fs.writeFile(filepath, buffer);
    
    const stats = await fs.stat(filepath);
    
    console.log(`[Screen Capture] Saved screenshot: ${filepath}`);
    
    return {
      id: filename.replace('.png', ''),
      filename,
      path: filepath,
      size: stats.size,
      createdAt: stats.birthtimeMs,
      width: size.width,
      height: size.height
    };
  } catch (error) {
    console.error('[Screen Capture] Error:', error);
    throw new Error(`Screen capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Capture a specific display by ID
 */
export async function captureDisplayById(displayId: string, savePath?: string): Promise<Screenshot> {
  console.log(`[Screen Capture] Capturing display ${displayId}`);
  
  try {
    // Get all sources
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { 
        width: 3840,
        height: 2160
      }
    });
    
    // Find the source for this display
    const source = sources.find(s => 
      s.id === displayId || 
      s.display_id === displayId ||
      s.id.includes(displayId)
    );
    
    if (!source) {
      console.log(`[Screen Capture] Display ${displayId} not found, using primary`);
      return await captureScreen({ savePath });
    }
    
    console.log(`[Screen Capture] Found source for display: ${source.name}`);
    
    const image = source.thumbnail;
    if (!image || image.isEmpty()) {
      throw new Error(`Captured image is empty for display ${displayId}`);
    }
    
    const size = image.getSize();
    const buffer = image.toPNG();
    
    await ensureScreenshotsDir(savePath);
    const filename = generateFilename();
    const filepath = path.join(getScreenshotsDir(savePath), filename);
    
    await fs.writeFile(filepath, buffer);
    
    const stats = await fs.stat(filepath);
    
    console.log(`[Screen Capture] Saved display ${displayId} screenshot: ${filepath}`);
    
    return {
      id: filename.replace('.png', ''),
      filename,
      path: filepath,
      size: stats.size,
      createdAt: stats.birthtimeMs,
      width: size.width,
      height: size.height,
      displayId
    };
  } catch (error) {
    console.error(`[Screen Capture] Error capturing display ${displayId}:`, error);
    throw new Error(`Display capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Capture all connected displays in parallel for better performance
 */
export async function captureAllDisplays(savePath?: string): Promise<Screenshot[]> {
  const displays = screen.getAllDisplays();
  
  console.log(`[Screen Capture] Capturing ${displays.length} displays in parallel`);
  
  // Capture all displays in parallel
  const capturePromises = displays.map(display => 
    captureDisplayById(display.id.toString(), savePath)
      .catch(error => {
        console.error(`Failed to capture display ${display.id}:`, error);
        return null; // Return null for failed captures
      })
  );
  
  const results = await Promise.all(capturePromises);
  
  // Filter out failed captures (null values)
  const screenshots = results.filter((screenshot): screenshot is Screenshot => screenshot !== null);
  
  if (screenshots.length === 0) {
    throw new Error('Failed to capture any displays');
  }
  
  console.log(`[Screen Capture] Successfully captured ${screenshots.length} of ${displays.length} displays`);
  
  return screenshots;
}