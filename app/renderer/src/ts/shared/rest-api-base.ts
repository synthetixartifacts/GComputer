/**
 * Base REST API Service
 * Provides common HTTP methods for all browser-based services
 */
export class RestApiBase {
  protected baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
  }

  protected async fetch<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('REST API request failed:', error);
      throw error;
    }
  }

  protected async get<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(`${this.baseUrl}${endpoint}`);
  }

  protected async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.fetch<T>(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  protected async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.fetch<T>(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  protected async delete<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
    });
  }
}