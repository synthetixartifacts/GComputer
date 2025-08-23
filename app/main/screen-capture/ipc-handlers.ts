/**
 * IPC handlers for screen capture functionality
 */

import { ipcMain } from 'electron';
import { getAllDisplays, getScreenSources } from './display-service.js';
import { captureScreen, captureDisplayById, captureAllDisplays } from './capture-service.js';
import { listScreenshots, deleteScreenshot, getScreenshot } from './screenshot-manager.js';
import type { CaptureOptions } from './types.js';

/**
 * Register all screen capture IPC handlers
 */
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

  ipcMain.handle('screen:capture', async (_, options?: CaptureOptions) => {
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