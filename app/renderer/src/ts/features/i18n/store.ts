import { derived, writable } from 'svelte/store';
import type { Locale, Messages } from './types';
import { getMessageByPath } from './utils';

export const locale = writable<Locale>('en');

export const messages = writable<Record<Locale, Messages>>({ en: {}, fr: {} });

export const currentMessages = derived([locale, messages], ([loc, all]) => all[loc] ?? {});

export const t = derived([currentMessages, locale], ([msgs, loc]) => {
  return (key: string, params?: Record<string, string | number>): string => {
    const raw = getMessageByPath(msgs, key);
    if (typeof raw !== 'string') return key;
    return raw.replace(/\{(\w+)\}/g, (_m, p1) => String(params?.[p1] ?? ''));
  };
});


