import type { Screenshot } from './types';
import { 
  setScreenshots, 
  setCapturing, 
  setLoading, 
  setError, 
  addScreenshot,
  removeScreenshot 
} from './store';
import { 
  sortScreenshotsByDate,
  isValidScreenshot,
  downloadScreenshot,
  copyImageToClipboard 
} from './utils';

// Type-safe access to window.gc.screen API
interface ScreenAPI {
  getDisplays(): Promise<import('./types').DisplayInfo[]>;
  getSources(): Promise<any[]>;
  capture(options?: { sourceId?: string; savePath?: string }): Promise<Screenshot>;
  captureDisplay(displayId: string, savePath?: string): Promise<Screenshot>;
  captureAll(savePath?: string): Promise<Screenshot[]>;
  list(customPath?: string): Promise<Screenshot[]>;
  delete(filename: string, customPath?: string): Promise<boolean>;
  get(filename: string, customPath?: string): Promise<string | null>;
}

function getScreenAPI(): ScreenAPI | null {
  if (typeof window !== 'undefined' && window.gc?.screen) {
    return window.gc.screen as any as ScreenAPI;
  }
  return null;
}

export async function captureScreen(options?: { sourceId?: string; savePath?: string }): Promise<void> {
  const api = getScreenAPI();
  if (!api) {
    setError('Screen capture API not available');
    return;
  }

  setCapturing(true);
  setError(null);

  try {
    const screenshot = await api.capture(options);
    addScreenshot(screenshot);
  } catch (error) {
    console.error('Failed to capture screen:', error);
    setError(error instanceof Error ? error.message : 'Failed to capture screen');
  } finally {
    setCapturing(false);
  }
}

export async function loadScreenshots(): Promise<void> {
  const api = getScreenAPI();
  if (!api) {
    setError('Screen capture API not available');
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const screenshots = await api.list();
    // Validate and sort screenshots
    const validScreenshots = screenshots.filter(isValidScreenshot);
    const sortedScreenshots = sortScreenshotsByDate(validScreenshots);
    setScreenshots(sortedScreenshots);
  } catch (error) {
    console.error('Failed to load screenshots:', error);
    setError(error instanceof Error ? error.message : 'Failed to load screenshots');
  } finally {
    setLoading(false);
  }
}

export async function deleteScreenshot(filename: string, id: string): Promise<boolean> {
  const api = getScreenAPI();
  if (!api) {
    setError('Screen capture API not available');
    return false;
  }

  try {
    const success = await api.delete(filename);
    if (success) {
      removeScreenshot(id);
    }
    return success;
  } catch (error) {
    console.error('Failed to delete screenshot:', error);
    setError(error instanceof Error ? error.message : 'Failed to delete screenshot');
    return false;
  }
}

export async function getScreenshotData(filename: string): Promise<string | null> {
  const api = getScreenAPI();
  if (!api) {
    setError('Screen capture API not available');
    return null;
  }

  try {
    return await api.get(filename);
  } catch (error) {
    console.error('Failed to get screenshot data:', error);
    return null;
  }
}

// Export download functionality
export async function downloadScreenshotById(screenshot: Screenshot): Promise<void> {
  const dataUrl = await getScreenshotData(screenshot.filename);
  if (dataUrl) {
    downloadScreenshot(screenshot, dataUrl);
  }
}

// Export copy to clipboard functionality
export async function copyScreenshotToClipboard(filename: string): Promise<boolean> {
  const dataUrl = await getScreenshotData(filename);
  if (dataUrl) {
    return copyImageToClipboard(dataUrl);
  }
  return false;
}

// Get all available displays
export async function getAvailableDisplays(): Promise<import('./types').DisplayInfo[]> {
  const api = getScreenAPI();
  if (!api) {
    setError('Screen capture API not available');
    return [];
  }

  try {
    return await api.getDisplays();
  } catch (error) {
    console.error('Failed to get displays:', error);
    setError(error instanceof Error ? error.message : 'Failed to get displays');
    return [];
  }
}

// Capture specific display
export async function captureDisplay(displayId: string, savePath?: string): Promise<void> {
  const api = getScreenAPI();
  if (!api) {
    const errorMsg = 'Screen capture API not available';
    setError(errorMsg);
    throw new Error(errorMsg);
  }

  setCapturing(true);
  setError(null);

  try {
    const screenshot = await api.captureDisplay(displayId, savePath);
    addScreenshot(screenshot);
  } catch (error) {
    console.error('Failed to capture display:', error);
    const errorMsg = error instanceof Error ? error.message : 'Failed to capture display';
    setError(errorMsg);
    throw error; // Re-throw to let the UI handle it
  } finally {
    setCapturing(false);
  }
}

// Capture all displays
export async function captureAllDisplays(savePath?: string): Promise<void> {
  const api = getScreenAPI();
  if (!api) {
    const errorMsg = 'Screen capture API not available';
    setError(errorMsg);
    throw new Error(errorMsg);
  }

  setCapturing(true);
  setError(null);

  try {
    const screenshots = await api.captureAll(savePath);
    screenshots.forEach(screenshot => addScreenshot(screenshot));
  } catch (error) {
    console.error('Failed to capture all displays:', error);
    const errorMsg = error instanceof Error ? error.message : 'Failed to capture displays';
    setError(errorMsg);
    throw error; // Re-throw to let the UI handle it
  } finally {
    setCapturing(false);
  }
}

// Re-export utility functions for backward compatibility
export { formatFileSize, formatTimestamp } from './utils';