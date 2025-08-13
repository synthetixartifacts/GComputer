import { ipcMain } from 'electron';
import path from 'node:path';
import { promises as fs } from 'node:fs';

type FsListedItem = {
  name: string;
  absolutePath: string;
  relativePath: string;
  sizeBytes: number;
  lastModified: number;
};

async function listFilesRecursively(rootPath: string): Promise<FsListedItem[]> {
  const results: FsListedItem[] = [];
  const rootName = path.basename(rootPath);

  async function walk(currentDir: string): Promise<void> {
    let entries: Array<string> = [];
    try {
      entries = await fs.readdir(currentDir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry);
      let stat: import('node:fs').Stats | null = null;
      try {
        stat = await fs.stat(fullPath);
      } catch {
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

export function registerFsIpc(): void {
  ipcMain.handle('fs:list-directory', async (_evt, payload: { path: string }): Promise<FsListedItem[]> => {
    const p = (payload?.path ?? '').toString();
    if (!p) return [];
    return await listFilesRecursively(p);
  });
}


