import { writable, derived } from 'svelte/store';
import type { AppSettings, Locale, ThemeMode } from './types';

export const settingsStore = writable<AppSettings>({
  version: 1,
  locale: 'en',
  themeMode: 'light',
});

export const localeStore = derived(settingsStore, (s) => s.locale);
export const themeModeStore = derived(settingsStore, (s) => s.themeMode);


