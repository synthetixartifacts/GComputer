import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { config } from 'dotenv';
import { registerSettingsIpc, getAllSettings } from './settings';
import { registerFsIpc } from './fs';
import { registerDbIpc, runDbMigrations, seedDefaultData } from './db';
import { registerScreenCaptureIpc } from './screen-capture';
import { setApplicationMenuForLocale } from './menu';
import { startApiServer } from './api-server';
import fs from 'node:fs';

// Load environment variables from .env file
// In development, it's two levels up from dist/main
// In production, it's in the app root directory (resources/app/)
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
    console.log('[main] Loaded .env from:', envPath);
    console.log('[main] Mode:', process.env.mode);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.log('[main] No .env file found, using default mode (production)');
  process.env.mode = 'production';
}

// Set app name for proper userData directory
app.setName('GComputer');

let mainWindow: BrowserWindow | null = null;

async function createMainWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;

  if (devUrl) {
    await mainWindow.loadURL(devUrl);
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(async () => {
  registerSettingsIpc();
  registerFsIpc();
  registerDbIpc();
  registerScreenCaptureIpc();
  
  // Ensure DB is migrated and seeded before use (dev path)
  try { 
    await runDbMigrations(); 
    await seedDefaultData();
  } catch (error) {
    console.error('[main] Database initialization failed:', error);
  }
  
  // Start API server for browser access
  try {
    await startApiServer();
  } catch (error) {
    console.error('[main] API server failed to start:', error);
  }
  
  // Initialize menu based on saved locale
  getAllSettings().then((s) => setApplicationMenuForLocale(s.locale)).catch(() => setApplicationMenuForLocale('en'));
  createMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createMainWindow();
  }
});


