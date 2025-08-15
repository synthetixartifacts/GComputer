export type ThemeMode = 'light' | 'dark' | 'fun';
export type Locale = 'en' | 'fr';

export interface AppSettings {
  version: number;
  locale: Locale;
  themeMode: ThemeMode;
}


