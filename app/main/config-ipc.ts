/**
 * Config Manager IPC Handlers
 * Handles configuration-related IPC communication
 */

import { ipcMain } from 'electron';
import { getPublicConfig, getEnv, hasSecret, getSecret } from './config-manager';

/**
 * Validate provider code to prevent injection attacks
 */
function isValidProviderCode(providerCode: string): boolean {
  const validProviderPattern = /^[a-zA-Z0-9_-]+$/;
  return Boolean(providerCode && validProviderPattern.test(providerCode));
}

/**
 * Register config manager IPC handlers
 */
export function registerConfigIpc(): void {
  // Get environment mode
  ipcMain.handle('settings:getEnvMode', async () => {
    const mode = getEnv('mode', 'production');
    console.log('[config] Returning env mode:', mode);
    return mode;
  });

  // Get public configuration
  ipcMain.handle('config:getPublic', async () => {
    return getPublicConfig();
  });

  // Get environment variable
  ipcMain.handle('config:getEnv', async (_evt, key: string, defaultValue?: string) => {
    return getEnv(key, defaultValue);
  });

  // Check if secret exists
  ipcMain.handle('config:hasSecret', async (_evt, providerCode: string) => {
    if (!isValidProviderCode(providerCode)) {
      console.error(`[config] Invalid provider code: ${providerCode}`);
      return false;
    }
    
    // Check for provider-specific key format (e.g., openai_key for openai provider)
    const key = `${providerCode}_key`;
    return hasSecret(key);
  });

  // Get secret value
  ipcMain.handle('config:getSecret', async (_evt, providerCode: string) => {
    if (!isValidProviderCode(providerCode)) {
      console.error(`[config] Invalid provider code: ${providerCode}`);
      return undefined;
    }
    
    // Check for provider-specific key format (e.g., openai_key for openai provider)
    const key = `${providerCode}_key`;
    return getSecret(key);
  });
}