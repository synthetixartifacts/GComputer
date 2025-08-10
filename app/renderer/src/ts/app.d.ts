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
    };
  }
}

export {};

