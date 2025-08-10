export type Locale = 'en' | 'fr';

export interface Messages {
  [key: string]: string | Messages;
}

export interface I18nCatalogs {
  [locale: string]: Messages;
}


