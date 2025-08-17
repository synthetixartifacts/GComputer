import type {
  Provider,
  Model,
  Agent,
  ProviderFilters,
  ModelFilters,
  AgentFilters,
  ProviderInsert,
  ModelInsert,
  AgentInsert,
  ProviderUpdate,
  ModelUpdate,
  AgentUpdate,
} from './types';

/**
 * Browser-compatible admin service using REST API
 * Mirrors the IPC admin service functionality
 */

const API_BASE_URL = 'http://localhost:3001/api';

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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`[Admin REST API] Request failed for ${endpoint}:`, error);
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