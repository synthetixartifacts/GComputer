import { ipcMain, desktopCapturer, nativeImage, screen, app, BrowserWindow } from 'electron';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { platform } from 'node:os';

type Screenshot = {
  id: string;
  filename: string;
  path: string;
  size: number;
  createdAt: number;
  width: number;
  height: number;
  displayId?: string;
};

type DisplayInfo = {
  id: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  workArea: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
  rotation: number;
  isPrimary: boolean;
};

// Get screenshots directory path
function getScreenshotsDir(customPath?: string): string {
  if (customPath) {
    // Handle relative paths by resolving them from app root
    if (!path.isAbsolute(customPath)) {
      return path.resolve(app.getAppPath(), customPath);
    }
    return customPath;
  }
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'assets', 'screenshots');
}

// Ensure screenshots directory exists
async function ensureScreenshotsDir(customPath?: string): Promise<void> {
  const dir = getScreenshotsDir(customPath);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Generate filename with timestamp
function generateFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `ps_${year}${month}${day}_${hours}${minutes}${seconds}.png`;
}

// Check if running in WSL2
function isWSL2(): boolean {
  // Check for WSL2 environment
  const isWSL = process.env.WSL_DISTRO_NAME || 
                process.env.WSL_INTEROP ||
                (platform() === 'linux' && process.env.PATH?.includes('/mnt/c'));
  
  if (isWSL) {
    console.log('[Screen Capture] WSL2 environment detected');
  }
  
  return !!isWSL;
}

// Alternative capture method using webContents (for WSL2 fallback)
async function captureWebContents(savePath?: string): Promise<Screenshot> {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  
  if (!win) {
    throw new Error('No window available for capture');
  }
  
  console.log('[Screen Capture] Using webContents.capturePage fallback');
  
  // Capture the current window's contents
  const image = await win.webContents.capturePage();
  
  if (!image || image.isEmpty()) {
    throw new Error('Failed to capture window contents');
  }
  
  const buffer = image.toPNG();
  
  await ensureScreenshotsDir(savePath);
  const filename = generateFilename();
  const filepath = path.join(getScreenshotsDir(savePath), filename);
  
  await fs.writeFile(filepath, buffer);
  
  const stats = await fs.stat(filepath);
  const size = image.getSize();
  
  console.log('[Screen Capture] Saved screenshot (webContents):', filepath);
  
  return {
    id: filename.replace('.png', ''),
    filename,
    path: filepath,
    size: stats.size,
    createdAt: stats.birthtimeMs,
    width: size.width,
    height: size.height
  };
}

// Get all available displays with full information
function getAllDisplays(): DisplayInfo[] {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();
  
  return displays.map((display, index) => ({
    id: display.id.toString(),
    name: display.id === primaryDisplay.id ? 'Primary Display' : `Display ${index + 1}`,
    bounds: display.bounds,
    workArea: display.workArea,
    scaleFactor: display.scaleFactor || 1,
    rotation: display.rotation || 0,
    isPrimary: display.id === primaryDisplay.id
  }));
}

// Get available screen sources for preview with enhanced display matching
async function getScreenSources(): Promise<any[]> {
  const displays = getAllDisplays();
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 150, height: 150 }
  });
  
  // Match sources with display information
  return sources.map(source => {
    const display = displays.find(d => d.id === source.display_id);
    return {
      id: source.id,
      name: display ? display.name : source.name,
      thumbnail: source.thumbnail.toDataURL(),
      display_id: source.display_id,
      displayInfo: display || null
    };
  });
}

// Capture screen with platform-specific handling
async function captureScreen(options?: { sourceId?: string; savePath?: string }): Promise<Screenshot> {
  try {
    // Get the primary display's FULL size (including taskbar/dock)
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.bounds; // Use bounds, not workAreaSize!
    const scaleFactor = primaryDisplay.scaleFactor || 1;
    
    console.log('[Screen Capture] Display info:', { 
      width, 
      height, 
      scaleFactor,
      platform: platform(),
      isWSL: isWSL2()
    });
    
    // If WSL2 is detected, use webContents fallback immediately
    if (isWSL2()) {
      try {
        return await captureWebContents(options?.savePath);
      } catch (webContentsError) {
        console.error('[Screen Capture] webContents fallback failed:', webContentsError);
        // Continue with desktopCapturer attempt
      }
    }
    
    // For native environments or when we can't get proper dimensions, use appropriate size
    const captureWidth = width > 0 ? Math.floor(width * scaleFactor) : 1920;
    const captureHeight = height > 0 ? Math.floor(height * scaleFactor) : 1080;
    
    console.log('[Screen Capture] Attempting desktopCapturer at:', { captureWidth, captureHeight });
    
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { 
        width: captureWidth, 
        height: captureHeight 
      }
    });

    if (sources.length === 0) {
      console.warn('[Screen Capture] No sources from desktopCapturer, trying webContents');
      return await captureWebContents(options?.savePath);
    }

    // Get the specified source or primary display source
    let source = sources[0];
    if (options?.sourceId) {
      const selectedSource = sources.find(s => s.id === options.sourceId);
      if (selectedSource) {
        source = selectedSource;
      }
    }
    
    if (!source.thumbnail || source.thumbnail.isEmpty()) {
      console.warn('[Screen Capture] Empty thumbnail from desktopCapturer, trying webContents');
      return await captureWebContents(options?.savePath);
    }
    
    const image = source.thumbnail;
    const buffer = image.toPNG();
    
    // Check if the image is actually black (all pixels are black)
    // This is a common issue with WSL2
    const pixels = image.toBitmap();
    let isBlack = true;
    for (let i = 0; i < Math.min(1000, pixels.length); i += 4) {
      // Check RGB values (ignoring alpha)
      if (pixels[i] !== 0 || pixels[i + 1] !== 0 || pixels[i + 2] !== 0) {
        isBlack = false;
        break;
      }
    }
    
    if (isBlack) {
      console.warn('[Screen Capture] Detected black screenshot, trying webContents');
      return await captureWebContents(options?.savePath);
    }
    
    await ensureScreenshotsDir(options?.savePath);
    const filename = generateFilename();
    const filepath = path.join(getScreenshotsDir(options?.savePath), filename);
    
    await fs.writeFile(filepath, buffer);
    
    const stats = await fs.stat(filepath);
    const size = image.getSize();
    
    console.log('[Screen Capture] Saved screenshot (desktopCapturer):', filepath);
    
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
    console.error('[Screen Capture] Primary method failed:', error);
    
    // Last resort: try webContents capture
    try {
      return await captureWebContents(options?.savePath);
    } catch (fallbackError) {
      console.error('[Screen Capture] All capture methods failed');
      throw new Error(`Screen capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// List all screenshots
async function listScreenshots(customPath?: string): Promise<Screenshot[]> {
  await ensureScreenshotsDir(customPath);
  const dir = getScreenshotsDir(customPath);
  
  try {
    const files = await fs.readdir(dir);
    const screenshots: Screenshot[] = [];
    
    for (const file of files) {
      if (file.startsWith('ps_') && file.endsWith('.png')) {
        const filepath = path.join(dir, file);
        const stats = await fs.stat(filepath);
        
        // Read image to get dimensions
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
    
    // Sort by creation date, newest first
    return screenshots.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error listing screenshots:', error);
    return [];
  }
}

// Delete a screenshot
async function deleteScreenshot(filename: string, customPath?: string): Promise<boolean> {
  try {
    const filepath = path.join(getScreenshotsDir(customPath), filename);
    await fs.unlink(filepath);
    return true;
  } catch (error) {
    console.error('Error deleting screenshot:', error);
    return false;
  }
}

// Get a single screenshot as base64
async function getScreenshot(filename: string, customPath?: string): Promise<string | null> {
  try {
    const filepath = path.join(getScreenshotsDir(customPath), filename);
    const buffer = await fs.readFile(filepath);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error('Error reading screenshot:', error);
    return null;
  }
}

// Capture a specific display by ID
async function captureDisplayById(displayId: string, savePath?: string): Promise<Screenshot> {
  const displays = screen.getAllDisplays();
  const display = displays.find(d => d.id.toString() === displayId);
  
  if (!display) {
    throw new Error(`Display with ID ${displayId} not found`);
  }
  
  const scaleFactor = display.scaleFactor || 1;
  const { width, height } = display.bounds;
  
  // Calculate actual capture dimensions considering scale factor
  const captureWidth = Math.floor(width * scaleFactor);
  const captureHeight = Math.floor(height * scaleFactor);
  
  console.log(`[Screen Capture] Capturing display ${displayId}:`, {
    bounds: display.bounds,
    scaleFactor,
    captureSize: { width: captureWidth, height: captureHeight }
  });
  
  // Get sources with proper size for this specific display
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: captureWidth, height: captureHeight }
  });
  
  // Find the source matching this display
  const source = sources.find(s => s.display_id === displayId);
  
  if (!source) {
    throw new Error(`No capture source found for display ${displayId}`);
  }
  
  if (source.thumbnail.isEmpty()) {
    throw new Error(`Captured image is empty for display ${displayId}`);
  }
  
  const image = source.thumbnail;
  const buffer = image.toPNG();
  
  await ensureScreenshotsDir(savePath);
  const filename = generateFilename();
  const filepath = path.join(getScreenshotsDir(savePath), filename);
  
  await fs.writeFile(filepath, buffer);
  
  const stats = await fs.stat(filepath);
  const size = image.getSize();
  
  console.log(`[Screen Capture] Saved display ${displayId} screenshot:`, filepath);
  
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
}

// Capture all connected displays
async function captureAllDisplays(savePath?: string): Promise<Screenshot[]> {
  const displays = screen.getAllDisplays();
  const screenshots: Screenshot[] = [];
  
  console.log(`[Screen Capture] Capturing ${displays.length} displays`);
  
  for (const display of displays) {
    try {
      const screenshot = await captureDisplayById(display.id.toString(), savePath);
      screenshots.push(screenshot);
    } catch (error) {
      console.error(`Failed to capture display ${display.id}:`, error);
      // Continue capturing other displays even if one fails
    }
  }
  
  if (screenshots.length === 0) {
    throw new Error('Failed to capture any displays');
  }
  
  return screenshots;
}

export function registerScreenCaptureIpc(): void {
  // Get all available displays
  ipcMain.handle('screen:getDisplays', async () => {
    try {
      return getAllDisplays();
    } catch (error) {
      console.error('Get displays error:', error);
      return [];
    }
  });
  
  ipcMain.handle('screen:getSources', async () => {
    try {
      return await getScreenSources();
    } catch (error) {
      console.error('Get sources error:', error);
      return [];
    }
  });

  ipcMain.handle('screen:capture', async (_, options?: { sourceId?: string; savePath?: string }) => {
    try {
      return await captureScreen(options);
    } catch (error) {
      console.error('Screen capture error:', error);
      throw error;
    }
  });
  
  // Capture specific display
  ipcMain.handle('screen:captureDisplay', async (_, displayId: string, savePath?: string) => {
    try {
      return await captureDisplayById(displayId, savePath);
    } catch (error) {
      console.error('Display capture error:', error);
      throw error;
    }
  });
  
  // Capture all displays
  ipcMain.handle('screen:captureAll', async (_, savePath?: string) => {
    try {
      return await captureAllDisplays(savePath);
    } catch (error) {
      console.error('Capture all displays error:', error);
      throw error;
    }
  });

  ipcMain.handle('screen:list', async (_, customPath?: string) => {
    try {
      return await listScreenshots(customPath);
    } catch (error) {
      console.error('List screenshots error:', error);
      return [];
    }
  });

  ipcMain.handle('screen:delete', async (_, filename: string, customPath?: string) => {
    try {
      return await deleteScreenshot(filename, customPath);
    } catch (error) {
      console.error('Delete screenshot error:', error);
      return false;
    }
  });

  ipcMain.handle('screen:get', async (_, filename: string, customPath?: string) => {
    try {
      return await getScreenshot(filename, customPath);
    } catch (error) {
      console.error('Get screenshot error:', error);
      return null;
    }
  });
}