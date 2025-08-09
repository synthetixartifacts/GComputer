import { contextBridge, ipcRenderer } from 'electron';

type ThemeMode = 'light' | 'dark' | 'fun';
type Locale = 'en' | 'fr';

export interface AppSettings {
  version: number;
  locale: Locale;
  themeMode: ThemeMode;
}

const settingsApi = {
  all(): Promise<AppSettings> {
    return ipcRenderer.invoke('settings:all');
  },
  get<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
    return ipcRenderer.invoke('settings:get', key);
  },
  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<AppSettings> {
    return ipcRenderer.invoke('settings:set', key, value);
  },
  subscribe(callback: (settings: AppSettings) => void): () => void {
    const listener = (_event: unknown, payload: AppSettings) => callback(payload);
    ipcRenderer.on('settings:changed', listener);
    return () => ipcRenderer.removeListener('settings:changed', listener);
  },
};

contextBridge.exposeInMainWorld('gc', {
  settings: settingsApi,
});

export {};


