import type { TestRow, TestFilters, TestInsert, TestUpdate } from './types';

/**
 * Browser-compatible database service using REST API
 * Fallback for when IPC is not available (browser environment)
 */

const API_BASE_URL = 'http://localhost:3001/api';

class RestApiService {
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
      console.error(`[REST API] Request failed for ${endpoint}:`, error);
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

const restApi = new RestApiService();

// Test table operations
export async function listTestRows(filters?: TestFilters): Promise<TestRow[]> {
  return await restApi.get('/test', filters);
}

export async function insertTestRow(values: TestInsert): Promise<TestRow | null> {
  return await restApi.post('/test', values);
}

export async function updateTestRow(update: TestUpdate): Promise<TestRow | null> {
  const { id, ...data } = update;
  return await restApi.put(`/test/${id}`, data);
}

export async function deleteTestRow(id: number): Promise<{ ok: true }> {
  return await restApi.delete(`/test/${id}`);
}

export async function truncateTestTable(): Promise<{ ok: true }> {
  return await restApi.delete('/test');
}