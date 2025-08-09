/// <reference types="svelte" />


declare global {
  type ThemeMode = 'light' | 'dark' | 'fun';
  type Locale = 'en' | 'fr';

  interface AppSettings {
    version: number;
    locale: Locale;
    themeMode: ThemeMode;
  }

  interface Window {
    gc: {
      settings: {
        all: () => Promise<AppSettings>;
        get: <K extends keyof AppSettings>(key: K) => Promise<AppSettings[K]>;
        set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<AppSettings>;
        subscribe: (callback: (settings: AppSettings) => void) => () => void;
      };
    };
  }
}

export {};

