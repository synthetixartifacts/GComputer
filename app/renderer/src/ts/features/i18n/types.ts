export type Locale = 'en' | 'fr';

export type Messages = Record<string, string | Messages>;

export interface I18nCatalogs {
  [locale: string]: Messages;
}


