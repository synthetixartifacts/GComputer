import type { AppSettings, Locale, ThemeMode } from './types';
import { settingsStore } from './store';
import { setLocale as setI18nLocale } from '@features/i18n/service';

function api() {
  return window.gc.settings;
}

export async function initSettings(): Promise<AppSettings> {
  const current = await api().all();
  settingsStore.set(current);
  api().subscribe((s) => settingsStore.set(s));
  return current;
}

export async function setLocale(locale: Locale): Promise<void> {
  await api().set('locale', locale);
  setI18nLocale(locale);
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  await api().set('themeMode', mode);
}


