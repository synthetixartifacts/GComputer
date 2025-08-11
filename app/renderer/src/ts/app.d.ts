/// <reference types="svelte" />


declare global {
  interface Window {
    gc: {
      settings: {
        all: () => Promise<import('@features/settings/types').AppSettings>;
        get: <K extends keyof import('@features/settings/types').AppSettings>(key: K) => Promise<import('@features/settings/types').AppSettings[K]>;
        set: <K extends keyof import('@features/settings/types').AppSettings>(key: K, value: import('@features/settings/types').AppSettings[K]) => Promise<import('@features/settings/types').AppSettings>;
        subscribe: (callback: (settings: import('@features/settings/types').AppSettings) => void) => () => void;
      };
      db: {
        test: {
          list: (filters?: { column1?: string; column2?: string }) => Promise<Array<{ id: number; column1: string | null; column2: string | null }>>;
          insert: (payload: { column1: string | null; column2: string | null }) => Promise<{ id: number; column1: string | null; column2: string | null } | null>;
          update: (payload: { id: number; column1?: string | null; column2?: string | null }) => Promise<{ id: number; column1: string | null; column2: string | null } | null>;
          delete: (id: number) => Promise<{ ok: true }>;
          truncate: () => Promise<{ ok: true }>;
        };
      };
    };
  }
}

export {};

