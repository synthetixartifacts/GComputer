/**
 * Environment Configuration Module
 * Handles environment setup and configuration loading
 */

import { app } from 'electron';
import { loadConfig, getEnv } from './config-manager';

/**
 * Load environment variables from .env file
 */
export function loadEnvironment(): void {
  loadConfig();
}

/**
 * Get current environment mode
 */
export function getEnvironmentMode(): string {
  return getEnv('mode', 'production') || 'production';
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.VITE_DEV_SERVER_URL !== undefined;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return !isDevelopment();
}

/**
 * Get application paths
 */
export function getAppPaths() {
  return {
    userData: app.getPath('userData'),
    appData: app.getPath('appData'),
    desktop: app.getPath('desktop'),
    documents: app.getPath('documents'),
    downloads: app.getPath('downloads'),
    pictures: app.getPath('pictures'),
    temp: app.getPath('temp'),
    home: app.getPath('home'),
  };
}