import { ipcMain } from 'electron';
import { testService } from '../services/index.js';
import type { TestFilters, TestInsert, TestUpdate } from '../types.js';

/**
 * Register IPC handlers for test table operations
 */
export function registerTestHandlers(): void {
  ipcMain.handle('db:test:list', async (_evt, filters?: TestFilters) => {
    return await testService.list(filters);
  });

  ipcMain.handle('db:test:insert', async (_evt, payload: TestInsert) => {
    return await testService.insert(payload);
  });

  ipcMain.handle('db:test:update', async (_evt, payload: TestUpdate) => {
    return await testService.update(payload);
  });

  ipcMain.handle('db:test:delete', async (_evt, id: number) => {
    return await testService.delete(id);
  });

  ipcMain.handle('db:test:truncate', async () => {
    return await testService.truncate();
  });
}