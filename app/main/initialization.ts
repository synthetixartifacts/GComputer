/**
 * Application Initialization Module
 * Orchestrates the initialization of all application features
 */

import { getAllSettings } from './settings';
import { setApplicationMenuForLocale } from './menu';
import { runDbMigrations, seedDefaultData } from './db';
import { startApiServer } from './api-server';

/**
 * Initialize database
 */
export async function initializeDatabase(): Promise<void> {
  try {
    await runDbMigrations();
    await seedDefaultData();
    console.log('[initialization] Database initialized successfully');
  } catch (error) {
    console.error('[initialization] Database initialization failed:', error);
    // Don't throw - allow app to start even if database fails
    // The app can still function with limited features
  }
}

/**
 * Initialize API server
 */
export async function initializeApiServer(): Promise<void> {
  try {
    await startApiServer();
    console.log('[initialization] API server started successfully');
  } catch (error) {
    console.error('[initialization] API server failed to start:', error);
    // Don't throw - API server is optional
  }
}

/**
 * Initialize application menu
 */
export async function initializeMenu(): Promise<void> {
  try {
    const settings = await getAllSettings();
    await setApplicationMenuForLocale(settings.locale);
    console.log('[initialization] Menu initialized with locale:', settings.locale);
  } catch (error) {
    console.warn('[initialization] Failed to load settings for menu, using default locale');
    await setApplicationMenuForLocale('en');
  }
}

/**
 * Initialize all application features
 * This is the main initialization orchestrator
 */
export async function initializeApplication(): Promise<void> {
  console.log('[initialization] Starting application initialization...');
  
  // Initialize database first as other features may depend on it
  await initializeDatabase();
  
  // Initialize API server for browser access
  await initializeApiServer();
  
  // Initialize application menu
  await initializeMenu();
  
  console.log('[initialization] Application initialization complete');
}