import { ipcMain } from 'electron';
import { providerService, modelService, agentService } from '../services/index.js';
import type {
  ProviderFilters,
  ProviderInsert,
  ProviderUpdate,
  ModelFilters,
  ModelInsert,
  ModelUpdate,
  AgentFilters,
  AgentInsert,
  AgentUpdate,
} from '../types.js';

/**
 * Register IPC handlers for admin operations (providers, models, agents)
 */
export function registerAdminHandlers(): void {
  // Provider handlers
  ipcMain.handle('db:admin:providers:list', async (_evt, filters?: ProviderFilters) => {
    return await providerService.list(filters);
  });

  ipcMain.handle('db:admin:providers:insert', async (_evt, payload: ProviderInsert) => {
    return await providerService.insert(payload);
  });

  ipcMain.handle('db:admin:providers:update', async (_evt, payload: ProviderUpdate) => {
    return await providerService.update(payload);
  });

  ipcMain.handle('db:admin:providers:delete', async (_evt, id: number) => {
    return await providerService.delete(id);
  });

  // Model handlers
  ipcMain.handle('db:admin:models:list', async (_evt, filters?: ModelFilters) => {
    return await modelService.list(filters);
  });

  ipcMain.handle('db:admin:models:insert', async (_evt, payload: ModelInsert) => {
    return await modelService.insert(payload);
  });

  ipcMain.handle('db:admin:models:update', async (_evt, payload: ModelUpdate) => {
    return await modelService.update(payload);
  });

  ipcMain.handle('db:admin:models:delete', async (_evt, id: number) => {
    return await modelService.delete(id);
  });

  // Agent handlers
  ipcMain.handle('db:admin:agents:list', async (_evt, filters?: AgentFilters) => {
    return await agentService.list(filters);
  });

  ipcMain.handle('db:admin:agents:insert', async (_evt, payload: AgentInsert) => {
    return await agentService.insert(payload);
  });

  ipcMain.handle('db:admin:agents:update', async (_evt, payload: AgentUpdate) => {
    return await agentService.update(payload);
  });

  ipcMain.handle('db:admin:agents:delete', async (_evt, id: number) => {
    return await agentService.delete(id);
  });
}