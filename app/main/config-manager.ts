/**
 * Configuration Manager Module
 * Generic utility for loading and accessing configuration from .env files
 */

import { config } from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

interface ConfigOptions {
  envPath?: string;
  secretPath?: string;
}

interface ConfigValues {
  env: Record<string, string>;
  secrets: Record<string, string>;
}

class ConfigManager {
  private static instance: ConfigManager;
  private values: ConfigValues = {
    env: {},
    secrets: {}
  };
  private loaded = false;

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Load configuration from .env and .env_secret files
   */
  load(options: ConfigOptions = {}): void {
    if (this.loaded) {
      return;
    }

    const isDev = process.env.VITE_DEV_SERVER_URL !== undefined;
    
    // Default paths
    const defaultEnvPath = this.findConfigFile('.env', isDev);
    const defaultSecretPath = this.findConfigFile('.env_secret', isDev);

    // Load .env file
    const envPath = options.envPath || defaultEnvPath;
    if (envPath && fs.existsSync(envPath)) {
      const result = config({ path: envPath });
      if (!result.error) {
        console.log('[ConfigManager] Loaded .env from:', envPath);
        this.values.env = { ...result.parsed };
      }
    } else {
      console.log('[ConfigManager] No .env file found');
    }

    // Load .env_secret file
    const secretPath = options.secretPath || defaultSecretPath;
    if (secretPath && fs.existsSync(secretPath)) {
      const result = config({ path: secretPath });
      if (!result.error) {
        console.log('[ConfigManager] Loaded .env_secret from:', secretPath);
        this.values.secrets = { ...result.parsed };
      }
    } else {
      console.log('[ConfigManager] No .env_secret file found');
    }

    // Set loaded flag
    this.loaded = true;
  }

  /**
   * Find configuration file in multiple paths
   */
  private findConfigFile(filename: string, isDev: boolean): string | null {
    // Try to use app.getAppPath() if electron is available
    let appPath: string | null = null;
    try {
      const { app } = require('electron');
      appPath = app.getAppPath();
    } catch {
      // Electron not available (e.g., in tests)
    }

    const paths = isDev 
      ? [
          path.join(__dirname, '../../', filename),  // Development path
        ]
      : [
          appPath && path.join(appPath, filename),  // Production: resources/app/
          process.resourcesPath && path.join(process.resourcesPath, 'app', filename),  // Alternative production path
          path.join(__dirname, '../../', filename),  // Fallback to development structure
        ].filter(Boolean) as string[];

    for (const filePath of paths) {
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
    return null;
  }

  /**
   * Get environment variable from .env file
   */
  getEnv(key: string, defaultValue?: string): string | undefined {
    return this.values.env[key] || process.env[key] || defaultValue;
  }

  /**
   * Get secret value from .env_secret file
   */
  getSecret(key: string, defaultValue?: string): string | undefined {
    return this.values.secrets[key] || defaultValue;
  }

  /**
   * Check if a secret exists
   */
  hasSecret(key: string): boolean {
    return key in this.values.secrets;
  }

  /**
   * Check if an environment variable exists
   */
  hasEnv(key: string): boolean {
    return key in this.values.env || key in process.env;
  }

  /**
   * Get all non-sensitive configuration (safe to expose to renderer)
   */
  getPublicConfig(): Record<string, any> {
    return {
      mode: this.getEnv('mode', 'production'),
      // Add other non-sensitive config here as needed
    };
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();

// Export convenience functions
export function loadConfig(options?: ConfigOptions): void {
  configManager.load(options);
}

export function getEnv(key: string, defaultValue?: string): string | undefined {
  return configManager.getEnv(key, defaultValue);
}

export function getSecret(key: string, defaultValue?: string): string | undefined {
  return configManager.getSecret(key, defaultValue);
}

export function hasSecret(key: string): boolean {
  return configManager.hasSecret(key);
}

export function hasEnv(key: string): boolean {
  return configManager.hasEnv(key);
}

export function getPublicConfig(): Record<string, any> {
  return configManager.getPublicConfig();
}