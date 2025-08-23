/**
 * Config Manager Service
 * Service layer for configuration management in renderer
 */

import { configManagerStore, get } from './store';
import type { PublicConfig } from './types';
import { isElectronEnvironment } from '@features/environment';

class ConfigManagerService {
  private static instance: ConfigManagerService;
  private initialized = false;

  private constructor() {}

  static getInstance(): ConfigManagerService {
    if (!ConfigManagerService.instance) {
      ConfigManagerService.instance = new ConfigManagerService();
    }
    return ConfigManagerService.instance;
  }

  /**
   * Initialize the config manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    configManagerStore.update(state => ({ ...state, loading: true }));

    try {
      // Load public config
      const publicConfig = await this.getPublicConfig();
      
      configManagerStore.update(state => ({
        ...state,
        publicConfig,
        loading: false,
        error: null,
      }));

      this.initialized = true;
    } catch (error) {
      console.error('[ConfigManager] Initialization failed:', error);
      configManagerStore.update(state => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize config manager',
      }));
    }
  }

  /**
   * Get public configuration
   */
  async getPublicConfig(): Promise<PublicConfig> {
    if (isElectronEnvironment() && window.gc?.config) {
      const config = await window.gc.config.getPublic();
      return {
        mode: config.mode || import.meta.env.MODE || 'production',
        ...config,
      };
    }
    
    // Fallback for browser environment
    return {
      mode: import.meta.env.MODE || 'production',
    };
  }

  /**
   * Get environment variable
   */
  async getEnv(key: string, defaultValue?: string): Promise<string | undefined> {
    // Check cache first using synchronous get
    const state = get(configManagerStore);

    if (state.envCache.has(key)) {
      return state.envCache.get(key);
    }

    // Fetch from main process
    if (isElectronEnvironment() && window.gc?.config) {
      const value = await window.gc.config.getEnv(key, defaultValue);
      
      // Update cache
      configManagerStore.update(state => {
        const newCache = new Map(state.envCache);
        newCache.set(key, value);
        return { ...state, envCache: newCache };
      });

      return value;
    }

    // Browser fallback
    return defaultValue;
  }

  /**
   * Check if a provider has a secret key configured
   */
  async hasProviderSecret(providerCode: string): Promise<boolean> {
    // Check cache first using synchronous get
    const state = get(configManagerStore);

    if (state.providerSecrets.has(providerCode)) {
      return state.providerSecrets.get(providerCode) || false;
    }

    // Validate provider code to prevent injection
    const validProviderPattern = /^[a-zA-Z0-9_-]+$/;
    if (!providerCode || !validProviderPattern.test(providerCode)) {
      return false;
    }

    // Fetch from main process
    if (isElectronEnvironment() && window.gc?.config) {
      const hasSecret = await window.gc.config.hasProviderSecret(providerCode);
      
      // Update cache
      configManagerStore.update(state => {
        const newSecrets = new Map(state.providerSecrets);
        newSecrets.set(providerCode, hasSecret);
        return { ...state, providerSecrets: newSecrets };
      });

      return hasSecret;
    }

    // Browser fallback - no secrets available
    return false;
  }

  /**
   * Get current mode
   */
  async getMode(): Promise<string> {
    const publicConfig = await this.getPublicConfig();
    return publicConfig.mode;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    configManagerStore.update(state => ({
      ...state,
      envCache: new Map(),
      providerSecrets: new Map(),
    }));
  }
}

// Export singleton instance
export const configManager = ConfigManagerService.getInstance();

// Export convenience functions
export async function initConfigManager(): Promise<void> {
  return configManager.initialize();
}

export async function getEnv(key: string, defaultValue?: string): Promise<string | undefined> {
  return configManager.getEnv(key, defaultValue);
}

export async function hasProviderSecret(providerCode: string): Promise<boolean> {
  return configManager.hasProviderSecret(providerCode);
}

export async function getConfigMode(): Promise<string> {
  return configManager.getMode();
}