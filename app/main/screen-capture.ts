import { ipcMain, desktopCapturer, nativeImage, screen, app } from 'electron';
import path from 'node:path';
import { promises as fs } from 'node:fs';

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

// Check if we're in development mode
function isDevMode(): boolean {
  return process.env.mode === 'development' || process.env.VITE_DEV_SERVER_URL !== undefined;
}

// Get screenshots directory path
function getScreenshotsDir(customPath?: string): string {
  if (customPath) {
    if (!path.isAbsolute(customPath)) {
      return path.resolve(app.getAppPath(), customPath);
    }
    return customPath;
  }
  
  // In dev mode, save to local project folder
  if (isDevMode()) {
    const projectRoot = path.join(__dirname, '..', '..');
    return path.join(projectRoot, 'screenshots');
  }
  
  // In production, use userData
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

// Simple native Electron screen capture
async function captureScreen(options?: { sourceId?: string; savePath?: string }): Promise<Screenshot> {
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

// Capture a specific display by ID
async function captureDisplayById(displayId: string, savePath?: string): Promise<Screenshot> {
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
    }
  }
  
  if (screenshots.length === 0) {
    throw new Error('Failed to capture any displays');
  }
  
  return screenshots;
}

// Get available screen sources for preview
async function getScreenSources(): Promise<any[]> {
  const displays = getAllDisplays();
  
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 320, height: 240 }
    });
    
    console.log(`[Screen Capture] Got ${sources.length} sources for preview`);
    
    return sources.map(source => {
      const display = displays.find(d => d.id === source.display_id);
      const thumbnail = source.thumbnail && !source.thumbnail.isEmpty() 
        ? source.thumbnail.toDataURL()
        : null;
      
      return {
        id: source.id,
        name: display ? display.name : source.name,
        thumbnail,
        display_id: source.display_id,
        displayInfo: display || null
      };
    });
  } catch (error) {
    console.error('[Screen Capture] Error getting sources:', error);
    return displays.map(display => ({
      id: `screen:${display.id}`,
      name: display.name,
      thumbnail: null,
      display_id: display.id,
      displayInfo: display
    }));
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
  
  ipcMain.handle('screen:captureDisplay', async (_, displayId: string, savePath?: string) => {
    try {
      return await captureDisplayById(displayId, savePath);
    } catch (error) {
      console.error('Display capture error:', error);
      throw error;
    }
  });
  
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