/**
 * Environment Configuration Module
 * Handles environment setup and configuration loading
 */

import { app } from 'electron';
import { config } from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

/**
 * Load environment variables from .env file
 */
export function loadEnvironment(): void {
  const isDev = process.env.VITE_DEV_SERVER_URL !== undefined;
  
  // Try multiple paths to find .env file
  const envPaths = isDev 
    ? [
        path.join(__dirname, '../../.env'),  // Development path
      ]
    : [
        path.join(app.getAppPath(), '.env'),  // Production: resources/app/.env
        path.join(process.resourcesPath, 'app', '.env'),  // Alternative production path
        path.join(__dirname, '../../.env'),  // Fallback to development structure
      ];

  let envLoaded = false;
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      config({ path: envPath });
      console.log('[environment] Loaded .env from:', envPath);
      console.log('[environment] Mode:', process.env.mode);
      envLoaded = true;
      break;
    }
  }

  if (!envLoaded) {
    console.log('[environment] No .env file found, using default mode (production)');
    process.env.mode = 'production';
  }
}

/**
 * Get current environment mode
 */
export function getEnvironmentMode(): string {
  return process.env.mode || 'production';
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