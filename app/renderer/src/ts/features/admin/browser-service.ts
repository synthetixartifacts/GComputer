import type {
  Provider,
  Model,
  Agent,
  Configuration,
  ProviderFilters,
  ModelFilters,
  AgentFilters,
  ConfigurationFilters,
  ProviderInsert,
  ModelInsert,
  AgentInsert,
  ConfigurationInsert,
  ProviderUpdate,
  ModelUpdate,
  AgentUpdate,
  ConfigurationUpdate,
} from './types';

/**
 * Browser-compatible admin service using REST API
 * Mirrors the IPC admin service functionality
 */

// Resolve API base URL with sensible fallbacks
// Priority: window.__GC_API_BASE_URL__ -> VITE_API_BASE_URL -> host/port/env -> default
const API_BASE_URL: string = (() => {
  try {
    const winBase = typeof window !== 'undefined' ? (window as any).__GC_API_BASE_URL__ : undefined;
    // Vite envs are only available in renderer/browser builds
    const viteBase = (typeof import.meta !== 'undefined' && (import.meta as any).env)
      ? (import.meta as any).env.VITE_API_BASE_URL
      : undefined;
    const vitePort = (typeof import.meta !== 'undefined' && (import.meta as any).env)
      ? (import.meta as any).env.VITE_API_PORT
      : undefined;
    const port = vitePort || 3001;
    return (
      winBase ||
      viteBase ||
      `http://localhost:${port}/api`
    );
  } catch {
    return 'http://localhost:3001/api';
  }
})();

class AdminRestApiService {
  private async fetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);

      if (!response.ok) {
        let bodyText = '';
        try {
          bodyText = await response.text();
        } catch {}
        const err = new Error(`HTTP ${response.status}: ${response.statusText} (${url})${bodyText ? ` -> ${bodyText}` : ''}`);
        throw err;
      }

      return await response.json();
    } catch (error) {
      console.error(`[Admin REST API] Request failed for ${endpoint} -> ${url}:`, error);
      throw error;
    }
  }

  async get(endpoint: string, params?: Record<string, any>): Promise<any> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
    return this.fetch(url, { method: 'GET' });
  }

  async post(endpoint: string, data: any): Promise<any> {
    return this.fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any): Promise<any> {
    return this.fetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string): Promise<any> {
    return this.fetch(endpoint, { method: 'DELETE' });
  }
}

const adminApi = new AdminRestApiService();

// Provider operations
export async function listProviders(filters?: ProviderFilters): Promise<Provider[]> {
  return await adminApi.get('/admin/providers', filters);
}

export async function createProvider(data: ProviderInsert): Promise<Provider | null> {
  return await adminApi.post('/admin/providers', data);
}

export async function updateProvider(data: ProviderUpdate): Promise<Provider | null> {
  const { id, ...updates } = data;
  return await adminApi.put(`/admin/providers/${id}`, updates);
}

export async function deleteProvider(id: number): Promise<{ ok: true }> {
  return await adminApi.delete(`/admin/providers/${id}`);
}

// Model operations
export async function listModels(filters?: ModelFilters): Promise<Model[]> {
  return await adminApi.get('/admin/models', filters);
}

export async function createModel(data: ModelInsert): Promise<Model | null> {
  return await adminApi.post('/admin/models', data);
}

export async function updateModel(data: ModelUpdate): Promise<Model | null> {
  const { id, ...updates } = data;
  return await adminApi.put(`/admin/models/${id}`, updates);
}

export async function deleteModel(id: number): Promise<{ ok: true }> {
  return await adminApi.delete(`/admin/models/${id}`);
}

// Agent operations
export async function listAgents(filters?: AgentFilters): Promise<Agent[]> {
  return await adminApi.get('/admin/agents', filters);
}

export async function createAgent(data: AgentInsert): Promise<Agent | null> {
  return await adminApi.post('/admin/agents', data);
}

export async function updateAgent(data: AgentUpdate): Promise<Agent | null> {
  const { id, ...updates } = data;
  return await adminApi.put(`/admin/agents/${id}`, updates);
}

export async function deleteAgent(id: number): Promise<{ ok: true }> {
  return await adminApi.delete(`/admin/agents/${id}`);
}

// Configuration operations
export async function listConfigurations(filters?: ConfigurationFilters): Promise<Configuration[]> {
  return await adminApi.get('/admin/configurations', filters);
}

export async function createConfiguration(data: ConfigurationInsert): Promise<Configuration | null> {
  return await adminApi.post('/admin/configurations', data);
}

export async function updateConfiguration(data: ConfigurationUpdate): Promise<Configuration | null> {
  const { id, ...updates } = data;
  return await adminApi.put(`/admin/configurations/${id}`, updates);
}

export async function deleteConfiguration(id: number): Promise<{ ok: true }> {
  return await adminApi.delete(`/admin/configurations/${id}`);
}

export async function getConfigurationByCode(code: string): Promise<Configuration | null> {
  return await adminApi.get(`/admin/configurations/code/${code}`);
}

export async function updateConfigurationByCode(code: string, value: string): Promise<Configuration | null> {
  return await adminApi.put(`/admin/configurations/code/${code}`, { value });
}

export async function getAllConfigurationsAsMap(): Promise<Record<string, string>> {
  return await adminApi.get('/admin/configurations/map');
}

// Utility functions (same as IPC version)
export function parseJsonConfiguration(configStr: string): Record<string, any> {
  try {
    return JSON.parse(configStr || '{}');
  } catch {
    return {};
  }
}

export function stringifyConfiguration(config: Record<string, any>): string {
  try {
    return JSON.stringify(config, null, 2);
  } catch {
    return '{}';
  }
}
