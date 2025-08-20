import { ipcMain, desktopCapturer, nativeImage, screen, app, BrowserWindow } from 'electron';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { platform } from 'node:os';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

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

// Capture screen using PowerShell in WSL2
async function captureWithPowerShell(savePath?: string): Promise<Screenshot> {
  console.log('[Screen Capture] Using PowerShell capture for WSL2');
  
  await ensureScreenshotsDir(savePath);
  const filename = generateFilename();
  const filepath = path.join(getScreenshotsDir(savePath), filename);
  
  // Convert WSL path to Windows path
  // Get the actual Windows user directory through environment or default to current user
  const windowsUser = process.env.USER || 'tommy';
  const windowsPath = filepath
    .replace(`/home/${windowsUser}`, `/mnt/c/Users/${windowsUser}`)
    .replace('/.config/', '/AppData/Roaming/')
    .replace(/\//g, '\\')
    .replace('\\mnt\\c', 'C:');
  
  // PowerShell script to capture screen - properly escaped
  const psScript = [
    'Add-Type -AssemblyName System.Windows.Forms,System.Drawing',
    '$screens = [Windows.Forms.Screen]::AllScreens',
    '$bounds = $screens[0].Bounds',
    '$bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height',
    '$graphics = [System.Drawing.Graphics]::FromImage($bmp)',
    '$graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)',
    `$bmp.Save('${windowsPath}')`,
    '$graphics.Dispose()',
    '$bmp.Dispose()',
    'Write-Output "SUCCESS"'
  ].join('; ');
  
  try {
    // Execute PowerShell command with properly escaped script
    const { stdout, stderr } = await execAsync(
      `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '\\"')}"`
    );
    
    if (stderr && !stderr.includes('SUCCESS')) {
      throw new Error(`PowerShell error: ${stderr}`);
    }
    
    // Wait a bit for file to be written
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify file exists
    const stats = await fs.stat(filepath);
    
    // Read the image to get dimensions
    const buffer = await fs.readFile(filepath);
    const image = nativeImage.createFromBuffer(buffer);
    const size = image.getSize();
    
    console.log('[Screen Capture] PowerShell capture successful:', filepath);
    
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
    console.error('[Screen Capture] PowerShell capture failed:', error);
    throw new Error(`PowerShell capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Alternative capture method using webContents (for WSL2 fallback)
async function captureWebContents(savePath?: string): Promise<Screenshot> {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  
  if (!win) {
    throw new Error('No window available for capture');
  }
  
  console.log('[Screen Capture] Using webContents.capturePage fallback');
  
  // Hide the window temporarily to capture the desktop behind it
  const wasVisible = win.isVisible();
  const wasFocused = win.isFocused();
  
  try {
    // Minimize window to capture desktop
    if (wasVisible) {
      win.minimize();
      // Wait a bit for minimize animation
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Try to capture the entire screen using a new hidden window
    const captureWin = new BrowserWindow({
      width: screen.getPrimaryDisplay().bounds.width,
      height: screen.getPrimaryDisplay().bounds.height,
      show: false,
      transparent: true,
      frame: false,
      webPreferences: {
        offscreen: true
      }
    });
    
    // Load a transparent page
    await captureWin.loadURL('data:text/html,<html><body style="margin:0;padding:0;"></body></html>');
    
    // Capture the page (which should show the desktop behind)
    const image = await captureWin.webContents.capturePage();
    
    // Clean up
    captureWin.destroy();
    
    // Restore original window state
    if (wasVisible) {
      win.restore();
      if (wasFocused) {
        win.focus();
      }
    }
    
    if (!image || image.isEmpty()) {
      throw new Error('Failed to capture screen contents');
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
  } catch (error) {
    // Restore window state on error
    if (wasVisible && win && !win.isDestroyed()) {
      win.restore();
      if (wasFocused) {
        win.focus();
      }
    }
    throw error;
  }
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
  
  try {
    // Get higher quality thumbnails for better preview
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 320, height: 240 }
    });
    
    // Check if sources are valid (not black)
    const validSources = sources.filter(source => {
      if (!source.thumbnail || source.thumbnail.isEmpty()) {
        return false;
      }
      
      // Quick check if thumbnail is black
      const pixels = source.thumbnail.toBitmap();
      let isBlack = true;
      for (let i = 0; i < Math.min(100, pixels.length); i += 4) {
        if (pixels[i] !== 0 || pixels[i + 1] !== 0 || pixels[i + 2] !== 0) {
          isBlack = false;
          break;
        }
      }
      
      return !isBlack;
    });
    
    // If all sources are black, try alternative method
    if (validSources.length === 0 && sources.length > 0) {
      console.warn('[Screen Capture] All thumbnails are black, providing display info only');
      // Return sources with display info but warn about black thumbnails
      return sources.map(source => {
        const display = displays.find(d => d.id === source.display_id);
        return {
          id: source.id,
          name: display ? display.name : source.name,
          thumbnail: null, // Explicitly null for black thumbnails
          display_id: source.display_id,
          displayInfo: display || null,
          isBlack: true
        };
      });
    }
    
    // Match sources with display information
    return validSources.map(source => {
      const display = displays.find(d => d.id === source.display_id);
      return {
        id: source.id,
        name: display ? display.name : source.name,
        thumbnail: source.thumbnail.toDataURL(),
        display_id: source.display_id,
        displayInfo: display || null,
        isBlack: false
      };
    });
  } catch (error) {
    console.error('[Screen Capture] Error getting sources:', error);
    // Return basic display information without thumbnails
    return displays.map(display => ({
      id: `screen:${display.id}`,
      name: display.name,
      thumbnail: null,
      display_id: display.id,
      displayInfo: display,
      isBlack: false
    }));
  }
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
    
    // If WSL2 is detected, use PowerShell capture immediately
    if (isWSL2()) {
      try {
        return await captureWithPowerShell(options?.savePath);
      } catch (psError) {
        console.error('[Screen Capture] PowerShell capture failed:', psError);
        // Try webContents as secondary fallback
        try {
          return await captureWebContents(options?.savePath);
        } catch (webContentsError) {
          console.error('[Screen Capture] webContents fallback also failed:', webContentsError);
          // Continue with desktopCapturer attempt as last resort
        }
      }
    }
    
    // For native environments or when we can't get proper dimensions, use appropriate size
    // Don't apply scale factor for capture size - use actual display resolution
    const captureWidth = width > 0 ? width : 1920;
    const captureHeight = height > 0 ? height : 1080;
    
    console.log('[Screen Capture] Attempting desktopCapturer at:', { captureWidth, captureHeight, scaleFactor });
    
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { 
        width: Math.min(captureWidth, 3840), // Cap at 4K to avoid memory issues
        height: Math.min(captureHeight, 2160) 
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
      console.warn('[Screen Capture] Detected black screenshot, trying PowerShell');
      // Try PowerShell capture if we're in WSL2
      if (isWSL2()) {
        try {
          return await captureWithPowerShell(options?.savePath);
        } catch (psError) {
          console.error('[Screen Capture] PowerShell fallback failed:', psError);
        }
      }
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
    
    // Last resort: try PowerShell if WSL2, then webContents
    if (isWSL2()) {
      try {
        return await captureWithPowerShell(options?.savePath);
      } catch (psError) {
        console.error('[Screen Capture] PowerShell fallback failed:', psError);
      }
    }
    
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
  // If WSL2, use PowerShell capture directly
  if (isWSL2()) {
    console.log(`[Screen Capture] WSL2 detected, using PowerShell for display ${displayId}`);
    try {
      const result = await captureWithPowerShell(savePath);
      return { ...result, displayId };
    } catch (psError) {
      console.error('[Screen Capture] PowerShell capture failed:', psError);
      // Fall through to try desktopCapturer
    }
  }
  
  const displays = screen.getAllDisplays();
  const display = displays.find(d => d.id.toString() === displayId);
  
  if (!display) {
    throw new Error(`Display with ID ${displayId} not found`);
  }
  
  const scaleFactor = display.scaleFactor || 1;
  const { width, height } = display.bounds;
  
  // Calculate actual capture dimensions
  const captureWidth = width;
  const captureHeight = height;
  
  console.log(`[Screen Capture] Capturing display ${displayId}:`, {
    bounds: display.bounds,
    scaleFactor,
    captureSize: { width: captureWidth, height: captureHeight }
  });
  
  try {
    // Get sources with proper size for this specific display
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { 
        width: Math.min(captureWidth, 3840),
        height: Math.min(captureHeight, 2160)
      }
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
    
    // Check if image is black
    const pixels = image.toBitmap();
    let isBlack = true;
    for (let i = 0; i < Math.min(1000, pixels.length); i += 4) {
      if (pixels[i] !== 0 || pixels[i + 1] !== 0 || pixels[i + 2] !== 0) {
        isBlack = false;
        break;
      }
    }
    
    if (isBlack) {
      console.warn(`[Screen Capture] Black screenshot detected for display ${displayId}`);
      if (isWSL2()) {
        // Try PowerShell as fallback
        const result = await captureWithPowerShell(savePath);
        return { ...result, displayId };
      }
      throw new Error(`Captured image is black for display ${displayId}`);
    }
    
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
  } catch (error) {
    console.error(`[Screen Capture] Failed to capture display ${displayId}:`, error);
    
    // Try PowerShell as final fallback for WSL2
    if (isWSL2()) {
      try {
        const result = await captureWithPowerShell(savePath);
        return { ...result, displayId };
      } catch (psError) {
        console.error('[Screen Capture] PowerShell fallback failed:', psError);
      }
    }
    
    throw error;
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