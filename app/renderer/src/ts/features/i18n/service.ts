import { locale as localeStore, messages as messagesStore } from './store';
import type { Locale, Messages } from './types';
import { loadBuiltinCatalog } from './utils';

export async function initI18n(initialLocale: Locale): Promise<void> {
  localeStore.set(initialLocale);
  const en = await loadBuiltinCatalog('en');
  const fr = await loadBuiltinCatalog('fr');
  messagesStore.set({ en, fr } as Record<Locale, Messages>);
}

export function setLocale(locale: Locale): void {
  localeStore.set(locale);
}


