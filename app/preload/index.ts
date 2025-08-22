import { contextBridge, ipcRenderer } from 'electron';

type ThemeMode = 'light' | 'dark' | 'fun';
type Locale = 'en' | 'fr';

export interface AppSettings {
  version: number;
  locale: Locale;
  themeMode: ThemeMode;
}

const settingsApi = {
  all(): Promise<AppSettings> {
    return ipcRenderer.invoke('settings:all');
  },
  get<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
    return ipcRenderer.invoke('settings:get', key);
  },
  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<AppSettings> {
    return ipcRenderer.invoke('settings:set', key, value);
  },
  getEnvMode(): Promise<string> {
    return ipcRenderer.invoke('settings:getEnvMode');
  },
  subscribe(callback: (settings: AppSettings) => void): () => void {
    const listener = (_event: unknown, payload: AppSettings) => callback(payload);
    ipcRenderer.on('settings:changed', listener);
    return () => ipcRenderer.removeListener('settings:changed', listener);
  },
};

const configApi = {
  getPublic(): Promise<Record<string, any>> {
    return ipcRenderer.invoke('config:getPublic');
  },
  getEnv(key: string, defaultValue?: string): Promise<string | undefined> {
    return ipcRenderer.invoke('config:getEnv', key, defaultValue);
  },
  hasProviderSecret(providerCode: string): Promise<boolean> {
    return ipcRenderer.invoke('config:hasSecret', providerCode);
  },
};

contextBridge.exposeInMainWorld('gc', {
  settings: settingsApi,
  config: configApi,
  fs: {
    listDirectory(path: string) {
      return ipcRenderer.invoke('fs:list-directory', { path });
    },
  },
  screen: {
    getDisplays() {
      return ipcRenderer.invoke('screen:getDisplays');
    },
    getSources() {
      return ipcRenderer.invoke('screen:getSources');
    },
    setPreviewDisplay(displayId: string | 'all') {
      ipcRenderer.send('screen:setPreviewDisplay', displayId);
    },
    capture(options?: { sourceId?: string; savePath?: string }) {
      return ipcRenderer.invoke('screen:capture', options);
    },
    captureDisplay(displayId: string, savePath?: string) {
      return ipcRenderer.invoke('screen:captureDisplay', displayId, savePath);
    },
    captureAll(savePath?: string) {
      return ipcRenderer.invoke('screen:captureAll', savePath);
    },
    list(customPath?: string) {
      return ipcRenderer.invoke('screen:list', customPath);
    },
    delete(filename: string, customPath?: string) {
      return ipcRenderer.invoke('screen:delete', filename, customPath);
    },
    get(filename: string, customPath?: string) {
      return ipcRenderer.invoke('screen:get', filename, customPath);
    },
  },
  db: {
    test: {
      list(filters?: { column1?: string; column2?: string }) {
        return ipcRenderer.invoke('db:test:list', filters);
      },
      insert(payload: { column1: string | null; column2: string | null }) {
        return ipcRenderer.invoke('db:test:insert', payload);
      },
      update(payload: { id: number; column1?: string | null; column2?: string | null }) {
        return ipcRenderer.invoke('db:test:update', payload);
      },
      delete(id: number) {
        return ipcRenderer.invoke('db:test:delete', id);
      },
      truncate() {
        return ipcRenderer.invoke('db:test:truncate');
      },
    },
    admin: {
      providers: {
        list(filters?: { code?: string; name?: string; url?: string }) {
          return ipcRenderer.invoke('db:admin:providers:list', filters);
        },
        insert(payload: { code: string; name: string; url: string; authentication: string; secretKey?: string; configuration?: string }) {
          return ipcRenderer.invoke('db:admin:providers:insert', payload);
        },
        update(payload: { id: number; code?: string; name?: string; url?: string; authentication?: string; secretKey?: string; configuration?: string }) {
          return ipcRenderer.invoke('db:admin:providers:update', payload);
        },
        delete(id: number) {
          return ipcRenderer.invoke('db:admin:providers:delete', id);
        },
      },
      models: {
        list(filters?: { code?: string; name?: string; model?: string }) {
          return ipcRenderer.invoke('db:admin:models:list', filters);
        },
        insert(payload: { code: string; name: string; model: string; inputPrice?: number; outputPrice?: number; endpoint: string; params?: string; messageLocation?: string; messageStreamLocation?: string; inputTokenCountLocation?: string; outputTokenCountLocation?: string; providerId: number }) {
          return ipcRenderer.invoke('db:admin:models:insert', payload);
        },
        update(payload: { id: number; code?: string; name?: string; model?: string; inputPrice?: number; outputPrice?: number; endpoint?: string; params?: string; messageLocation?: string; messageStreamLocation?: string; inputTokenCountLocation?: string; outputTokenCountLocation?: string; providerId?: number }) {
          return ipcRenderer.invoke('db:admin:models:update', payload);
        },
        delete(id: number) {
          return ipcRenderer.invoke('db:admin:models:delete', id);
        },
      },
      agents: {
        list(filters?: { code?: string; name?: string; version?: string }) {
          return ipcRenderer.invoke('db:admin:agents:list', filters);
        },
        insert(payload: { code: string; name: string; description?: string; version?: string; enable?: boolean; isSystem?: boolean; systemPrompt?: string; configuration?: string; modelId: number }) {
          return ipcRenderer.invoke('db:admin:agents:insert', payload);
        },
        update(payload: { id: number; code?: string; name?: string; description?: string; version?: string; enable?: boolean; isSystem?: boolean; systemPrompt?: string; configuration?: string; modelId?: number }) {
          return ipcRenderer.invoke('db:admin:agents:update', payload);
        },
        delete(id: number) {
          return ipcRenderer.invoke('db:admin:agents:delete', id);
        },
      },
    },
    discussions: {
      list(filters?: { isFavorite?: boolean; agentId?: number; search?: string }) {
        return ipcRenderer.invoke('db:discussions:list', filters);
      },
      create(payload: { title?: string; isFavorite?: boolean; agentId: number }) {
        return ipcRenderer.invoke('db:discussions:create', payload);
      },
      update(payload: { id: number; title?: string; isFavorite?: boolean; agentId?: number }) {
        return ipcRenderer.invoke('db:discussions:update', payload);
      },
      delete(id: number) {
        return ipcRenderer.invoke('db:discussions:delete', id);
      },
      getWithMessages(discussionId: number) {
        return ipcRenderer.invoke('db:discussions:getWithMessages', discussionId);
      },
      toggleFavorite(discussionId: number) {
        return ipcRenderer.invoke('db:discussions:toggleFavorite', discussionId);
      },
    },
    messages: {
      list(filters?: { discussionId?: number; who?: 'user' | 'agent' }) {
        return ipcRenderer.invoke('db:messages:list', filters);
      },
      create(payload: { who: 'user' | 'agent'; content: string; discussionId: number }) {
        return ipcRenderer.invoke('db:messages:create', payload);
      },
      getByDiscussion(discussionId: number) {
        return ipcRenderer.invoke('db:messages:getByDiscussion', discussionId);
      },
      getLastMessages(discussionId: number, limit?: number) {
        return ipcRenderer.invoke('db:messages:getLastMessages', discussionId, limit);
      },
      countByDiscussion(discussionId: number) {
        return ipcRenderer.invoke('db:messages:countByDiscussion', discussionId);
      },
      deleteByDiscussion(discussionId: number) {
        return ipcRenderer.invoke('db:messages:deleteByDiscussion', discussionId);
      },
    },
  },
});

export {};


