import type { Messages } from './types';

export function getMessageByPath(obj: any, path: string): unknown {
  const parts = path.split('.');
  let cur: any = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) {
      cur = cur[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

export async function loadBuiltinCatalog(locale: 'en' | 'fr'): Promise<Messages> {
  switch (locale) {
    case 'en':
      return (await import('./locales/en.json')).default as Messages;
    case 'fr':
      return (await import('./locales/fr.json')).default as Messages;
  }
}


