import { app, BrowserWindow, ipcMain } from 'electron';
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';

// Keep in sync with renderer types
export type ThemeMode = 'light' | 'dark' | 'fun';
export type Locale = 'en' | 'fr';

export interface AppSettings {
  version: number;
  locale: Locale;
  themeMode: ThemeMode;
}

const SETTINGS_FILE = 'settings.json';
const CURRENT_VERSION = 1;

const defaultSettings: AppSettings = {
  version: CURRENT_VERSION,
  locale: 'en',
  themeMode: 'light',
};

let cachedSettings: AppSettings | null = null;

function getSettingsPath(): string {
  const dir = app.getPath('userData');
  return path.join(dir, SETTINGS_FILE);
}

function isValidLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'fr';
}

function isValidThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'fun';
}

function migrateSettings(raw: any): AppSettings {
  // Simple migration scaffold. For now, ensure fields exist and are valid.
  const safe: AppSettings = {
    version: typeof raw?.version === 'number' ? raw.version : CURRENT_VERSION,
    locale: isValidLocale(raw?.locale) ? raw.locale : defaultSettings.locale,
    themeMode: isValidThemeMode(raw?.themeMode) ? raw.themeMode : defaultSettings.themeMode,
  };
  // Example: future migrations based on version can be applied here
  safe.version = CURRENT_VERSION;
  return safe;
}

async function readSettingsFromDisk(): Promise<AppSettings> {
  const settingsPath = getSettingsPath();
  try {
    const buf = await fs.readFile(settingsPath, 'utf8');
    const parsed = JSON.parse(buf);
    const migrated = migrateSettings(parsed);
    return migrated;
  } catch (err: any) {
    // If file doesn't exist or is invalid, write defaults
    await writeSettingsToDisk(defaultSettings);
    return { ...defaultSettings };
  }
}

async function writeSettingsToDisk(settings: AppSettings): Promise<void> {
  const settingsPath = getSettingsPath();
  const dir = path.dirname(settingsPath);
  await fs.mkdir(dir, { recursive: true });

  // Atomic-ish write: write to temp then rename
  const tmpPath = settingsPath + '.tmp';
  const data = JSON.stringify(settings, null, 2);
  await fs.writeFile(tmpPath, data, 'utf8');
  await fs.rename(tmpPath, settingsPath);
}

export async function getAllSettings(): Promise<AppSettings> {
  if (cachedSettings) return cachedSettings;
  cachedSettings = await readSettingsFromDisk();
  return cachedSettings;
}

export async function getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
  const s = await getAllSettings();
  return s[key];
}

export async function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<AppSettings> {
  const current = await getAllSettings();

  // Validate per key
  if (key === 'locale' && !isValidLocale(value)) throw new Error('Invalid locale');
  if (key === 'themeMode' && !isValidThemeMode(value)) throw new Error('Invalid themeMode');
  if (key === 'version') throw new Error('version is managed internally');

  const next: AppSettings = { ...current, [key]: value } as AppSettings;
  cachedSettings = next;
  await writeSettingsToDisk(next);
  broadcastSettingsChanged(next);
  return next;
}

function broadcastSettingsChanged(settings: AppSettings): void {
  const all = BrowserWindow.getAllWindows();
  for (const w of all) {
    w.webContents.send('settings:changed', settings);
  }
}

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:all', async () => {
    return await getAllSettings();
  });

  ipcMain.handle('settings:get', async (_evt, key: keyof AppSettings) => {
    return await getSetting(key);
  });

  ipcMain.handle('settings:set', async (_evt, key: keyof AppSettings, value: any) => {
    return await setSetting(key as any, value);
  });

  // Optional: file watcher if settings modified externally
  try {
    const p = getSettingsPath();
    if (fssync.existsSync(p)) {
      fssync.watch(p, { persistent: false }, async (eventType) => {
        if (eventType === 'change') {
          try {
            const latest = await readSettingsFromDisk();
            cachedSettings = latest;
            broadcastSettingsChanged(latest);
          } catch {
            // ignore
          }
        }
      });
    }
  } catch {
    // ignore watch errors
  }
}


