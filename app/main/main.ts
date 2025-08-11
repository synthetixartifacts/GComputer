import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { registerSettingsIpc, getAllSettings } from './settings';
import { registerDbIpc, runDbMigrations } from './db';
import { setApplicationMenuForLocale } from './menu';

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

app.whenReady().then(() => {
  registerSettingsIpc();
    registerDbIpc();
    // Ensure DB is migrated before use (dev path)
    try { runDbMigrations(); } catch {}
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


