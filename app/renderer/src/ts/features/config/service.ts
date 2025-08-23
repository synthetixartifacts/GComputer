import { configMode } from './store';
import type { ConfigMode } from './types';
import { isElectronEnvironment } from '@features/environment/service';

let initialized = false;

export async function initConfig(): Promise<ConfigMode> {
  if (initialized) {
    return await getConfigMode();
  }
  
  const mode = await getConfigMode();
  configMode.set(mode);
  initialized = true;
  
  console.log('[Config] Initialized with mode:', mode);
  return mode;
}

async function getConfigMode(): Promise<ConfigMode> {
  if (isElectronEnvironment() && window.gc?.settings) {
    try {
      const mode = await window.gc.settings.getEnvMode();
      return validateConfigMode(mode);
    } catch (error) {
      console.error('[Config] Failed to get env mode from main process:', error);
    }
  }
  
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const mode = import.meta.env.MODE || 'production';
    return validateConfigMode(mode);
  }
  
  return 'production';
}

function validateConfigMode(mode: string): ConfigMode {
  if (mode === 'dev' || mode === 'beta' || mode === 'production') {
    return mode;
  }
  
  if (mode === 'development') {
    return 'dev';
  }
  
  console.warn(`[Config] Invalid mode "${mode}", falling back to production`);
  return 'production';
}

export function setConfigMode(mode: ConfigMode): void {
  configMode.set(mode);
  console.log('[Config] Mode changed to:', mode);
}