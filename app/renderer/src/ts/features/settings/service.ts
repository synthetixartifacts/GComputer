import type { AppSettings, Locale, ThemeMode } from './types';
import { settingsStore } from './store';
import { setLocale as setI18nLocale } from '@ts/i18n/service';

type SettingsApi = {
  all: () => Promise<AppSettings>;
  get: <K extends keyof AppSettings>(key: K) => Promise<AppSettings[K]>;
  set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<AppSettings>;
  subscribe: (callback: (settings: AppSettings) => void) => () => void;
};

const FALLBACK_STORAGE_KEY = 'gc:settings';
const FALLBACK_DEFAULTS: AppSettings = { version: 1, locale: 'en', themeMode: 'light' };

function createFallbackApi(): SettingsApi {
  let listeners = new Set<(s: AppSettings) => void>();

  function read(): AppSettings {
    try {
      const raw = localStorage.getItem(FALLBACK_STORAGE_KEY);
      if (!raw) return { ...FALLBACK_DEFAULTS };
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      return {
        version: 1,
        locale: (parsed.locale === 'fr' ? 'fr' : 'en') as Locale,
        themeMode: (parsed.themeMode === 'dark' || parsed.themeMode === 'fun' ? parsed.themeMode : 'light') as ThemeMode,
      };
    } catch {
      return { ...FALLBACK_DEFAULTS };
    }
  }

  function write(next: AppSettings): void {
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(next));
    for (const cb of listeners) cb(next);
  }

  return {
    async all() { return read(); },
    async get(key) { return read()[key]; },
    async set(key, value) {
      const current = read();
      const next = { ...current, [key]: value } as AppSettings;
      write(next);
      return next;
    },
    subscribe(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };
}

let cachedFallbackApi: SettingsApi | null = null;
function api(): SettingsApi {
  const win = window as any;
  if (win && win.gc && win.gc.settings) return win.gc.settings as SettingsApi;
  if (!cachedFallbackApi) cachedFallbackApi = createFallbackApi();
  return cachedFallbackApi;
}

export async function initSettings(): Promise<AppSettings> {
  const current = await api().all();
  settingsStore.set(current);
  api().subscribe((s) => settingsStore.set(s));
  return current;
}

export async function setLocale(locale: Locale): Promise<void> {
  const next = await api().set('locale', locale);
  // Optimistically update local stores for immediate UI response
  settingsStore.set(next);
  setI18nLocale(locale);
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  const next = await api().set('themeMode', mode);
  // Optimistically update local store so subscribers (e.g., theme DOM) react immediately
  settingsStore.set(next);
}


