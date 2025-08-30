/// <reference types="svelte" />


declare global {
  interface Window {
    gc: {
      settings: {
        all: () => Promise<import('@features/settings/types').AppSettings>;
        get: <K extends keyof import('@features/settings/types').AppSettings>(key: K) => Promise<import('@features/settings/types').AppSettings[K]>;
        set: <K extends keyof import('@features/settings/types').AppSettings>(key: K, value: import('@features/settings/types').AppSettings[K]) => Promise<import('@features/settings/types').AppSettings>;
        subscribe: (callback: (settings: import('@features/settings/types').AppSettings) => void) => () => void;
        getEnvMode: () => Promise<string>;
      };
      config: {
        getPublic: () => Promise<Record<string, any>>;
        getEnv: (key: string, defaultValue?: string) => Promise<string | undefined>;
        hasProviderSecret: (providerCode: string) => Promise<boolean>;
      };
      fs: {
        listDirectory: (path: string) => Promise<Array<{ name: string; absolutePath: string; relativePath: string; sizeBytes: number; lastModified: number }>>;
      };
      screen: {
        getDisplays: () => Promise<import('@features/computer-capture/types').DisplayInfo[]>;
        getSources: () => Promise<any[]>;
        capture: (options?: { sourceId?: string; savePath?: string }) => Promise<import('@features/computer-capture/types').Screenshot>;
        captureDisplay: (displayId: string, savePath?: string) => Promise<import('@features/computer-capture/types').Screenshot>;
        captureAll: (savePath?: string) => Promise<import('@features/computer-capture/types').Screenshot[]>;
        list: (customPath?: string) => Promise<import('@features/computer-capture/types').Screenshot[]>;
        delete: (filename: string, customPath?: string) => Promise<boolean>;
        get: (filename: string, customPath?: string) => Promise<string | null>;
      };
      context: {
        getSelected: () => Promise<{ success: boolean; text?: string; timestamp?: number; error?: string }>;
        showMenu: (position?: { x: number; y: number }) => Promise<{ success: boolean; error?: string }>;
        hideMenu: () => Promise<{ success: boolean; error?: string }>;
        executeAction: (action: string, text: string) => Promise<{ success: boolean; action?: string; text?: string; result?: string; error?: string }>;
        getClipboard: () => Promise<{ success: boolean; text?: string; timestamp?: number; error?: string }>;
        setClipboard: (text: string) => Promise<{ success: boolean; error?: string }>;
        getShortcuts: () => Promise<{ success: boolean; shortcuts?: { primary: string; secondary?: string }; error?: string }>;
        updateShortcuts: (shortcuts: { primary?: string; secondary?: string }) => Promise<{ success: boolean; error?: string }>;
        getConfig: () => Promise<{ success: boolean; config?: { enabled: boolean; shortcut: string; actions: string[] }; error?: string }>;
        updateConfig: (config: { enabled?: boolean; shortcut?: string; actions?: string[] }) => Promise<{ success: boolean; error?: string }>;
      };
      db: {
        test: {
          list: (filters?: { column1?: string; column2?: string }) => Promise<Array<{ id: number; column1: string | null; column2: string | null }>>;
          insert: (payload: { column1: string | null; column2: string | null }) => Promise<{ id: number; column1: string | null; column2: string | null } | null>;
          update: (payload: { id: number; column1?: string | null; column2?: string | null }) => Promise<{ id: number; column1: string | null; column2: string | null } | null>;
          delete: (id: number) => Promise<{ ok: true }>;
          truncate: () => Promise<{ ok: true }>;
        };
        admin: {
          providers: {
            list: (filters?: import('@features/admin/types').ProviderFilters) => Promise<import('@features/admin/types').Provider[]>;
            insert: (payload: import('@features/admin/types').ProviderInsert) => Promise<import('@features/admin/types').Provider | null>;
            update: (payload: import('@features/admin/types').ProviderUpdate) => Promise<import('@features/admin/types').Provider | null>;
            delete: (id: number) => Promise<{ ok: true }>;
          };
          models: {
            list: (filters?: import('@features/admin/types').ModelFilters) => Promise<import('@features/admin/types').Model[]>;
            insert: (payload: import('@features/admin/types').ModelInsert) => Promise<import('@features/admin/types').Model | null>;
            update: (payload: import('@features/admin/types').ModelUpdate) => Promise<import('@features/admin/types').Model | null>;
            delete: (id: number) => Promise<{ ok: true }>;
          };
          agents: {
            list: (filters?: import('@features/admin/types').AgentFilters) => Promise<import('@features/admin/types').Agent[]>;
            insert: (payload: import('@features/admin/types').AgentInsert) => Promise<import('@features/admin/types').Agent | null>;
            update: (payload: import('@features/admin/types').AgentUpdate) => Promise<import('@features/admin/types').Agent | null>;
            delete: (id: number) => Promise<{ ok: true }>;
          };
        };
        discussions: {
          list: (filters?: import('@features/discussion/types').DiscussionFilters) => Promise<import('@features/discussion/types').Discussion[]>;
          create: (payload: import('@features/discussion/types').CreateDiscussionPayload) => Promise<import('@features/discussion/types').Discussion | null>;
          update: (payload: import('@features/discussion/types').UpdateDiscussionPayload) => Promise<import('@features/discussion/types').Discussion | null>;
          delete: (id: number) => Promise<{ ok: true }>;
          getWithMessages: (discussionId: number) => Promise<import('@features/discussion/types').DiscussionWithMessages | null>;
          toggleFavorite: (discussionId: number) => Promise<import('@features/discussion/types').Discussion | null>;
        };
        messages: {
          list: (filters?: import('@features/discussion/types').MessageFilters) => Promise<import('@features/discussion/types').Message[]>;
          create: (payload: import('@features/discussion/types').CreateMessagePayload) => Promise<import('@features/discussion/types').Message | null>;
          getByDiscussion: (discussionId: number) => Promise<import('@features/discussion/types').Message[]>;
          getLastMessages: (discussionId: number, limit?: number) => Promise<import('@features/discussion/types').Message[]>;
          countByDiscussion: (discussionId: number) => Promise<number>;
          deleteByDiscussion: (discussionId: number) => Promise<{ ok: true }>;
        };
      };
    };
  }
}

export {};

