/**
 * File System Module
 * Handles file system operations and IPC handlers
 */

import { ipcMain } from 'electron';
import path from 'node:path';
import { promises as fs, Stats } from 'node:fs';

/**
 * File system item information
 */
export interface FsListedItem {
  name: string;
  absolutePath: string;
  relativePath: string;
  sizeBytes: number;
  lastModified: number;
}

/**
 * List files recursively from a root path
 */
async function listFilesRecursively(rootPath: string): Promise<FsListedItem[]> {
  const results: FsListedItem[] = [];
  const rootName = path.basename(rootPath);

  async function walk(currentDir: string): Promise<void> {
    let entries: string[] = [];
    try {
      entries = await fs.readdir(currentDir);
    } catch (error) {
      console.warn(`[fs] Cannot read directory: ${currentDir}`, error);
      return;
    }
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry);
      let stat: Stats | null = null;
      
      try {
        stat = await fs.stat(fullPath);
      } catch (error) {
        console.debug(`[fs] Cannot stat file: ${fullPath}`, error);
        continue;
      }
      
      if (!stat) continue;
      
      if (stat.isDirectory()) {
        await walk(fullPath);
      } else if (stat.isFile()) {
        const relFromRoot = path.relative(rootPath, fullPath).split(path.sep).join('/');
        results.push({
          name: path.basename(fullPath),
          absolutePath: fullPath,
          relativePath: `${rootName}/${relFromRoot}`,
          sizeBytes: stat.size,
          lastModified: stat.mtimeMs,
        });
      }
    }
  }

  await walk(rootPath);
  return results;
}

/**
 * Register file system IPC handlers
 */
export function registerFsIpc(): void {
  ipcMain.handle('fs:list-directory', async (_event, payload: { path: string }): Promise<FsListedItem[]> => {
    const targetPath = (payload?.path ?? '').toString();
    
    if (!targetPath) {
      return [];
    }
    
    try {
      return await listFilesRecursively(targetPath);
    } catch (error) {
      console.error('[fs] Error listing directory:', error);
      return [];
    }
  });
}