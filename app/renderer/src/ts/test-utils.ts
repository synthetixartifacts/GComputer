import { render, type RenderResult } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { ComponentType } from 'svelte';
import { writable, type Writable } from 'svelte/store';

/**
 * Enhanced render function for Svelte components
 */
export function renderComponent<T extends Record<string, any>>(
  Component: ComponentType,
  props?: T,
  options?: any
): RenderResult {
  return render(Component, { props, ...options });
}

/**
 * Create a mock Svelte store for testing
 */
export function createMockStore<T>(initialValue: T): Writable<T> & { get: () => T } {
  const subscribers = new Set<(value: T) => void>();
  let value = initialValue;

  return {
    subscribe(fn: (value: T) => void) {
      subscribers.add(fn);
      fn(value);
      return () => subscribers.delete(fn);
    },
    set(newValue: T) {
      value = newValue;
      subscribers.forEach(fn => fn(value));
    },
    update(fn: (value: T) => T) {
      value = fn(value);
      subscribers.forEach(sub => sub(value));
    },
    get() {
      return value;
    },
  };
}

/**
 * Wait for Svelte to update the DOM
 */
export async function waitForSvelteUpdate(): Promise<void> {
  await tick();
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Create mock props for admin field configs
 */
export function createMockFieldConfig(overrides?: Partial<any>) {
  return {
    id: 'testField',
    label: 'Test Field',
    type: 'text',
    required: false,
    placeholder: '',
    ...overrides,
  };
}

/**
 * Create mock entity data for testing
 */
export function createMockEntity(type: 'provider' | 'model' | 'agent', overrides?: Partial<any>) {
  const now = new Date();
  
  const entities = {
    provider: {
      id: 1,
      code: 'test-provider',
      name: 'Test Provider',
      url: 'https://api.test.com',
      authentication: 'bearer',
      secretKey: null,
      configuration: '{}',
      createdAt: now,
      updatedAt: now,
    },
    model: {
      id: 1,
      code: 'test-model',
      name: 'Test Model',
      providerId: 1,
      provider: {
        id: 1,
        code: 'test-provider',
        name: 'Test Provider',
      },
      configuration: '{}',
      createdAt: now,
      updatedAt: now,
    },
    agent: {
      id: 1,
      code: 'test-agent',
      name: 'Test Agent',
      modelId: 1,
      model: {
        id: 1,
        code: 'test-model',
        name: 'Test Model',
        provider: {
          id: 1,
          code: 'test-provider',
          name: 'Test Provider',
        },
      },
      systemMessage: 'Test system message',
      configuration: '{}',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  };
  
  return {
    ...entities[type],
    ...overrides,
  };
}

/**
 * Create mock service for testing
 */
export function createMockService<T = any>() {
  return {
    list: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({} as T),
    update: vi.fn().mockResolvedValue({} as T),
    delete: vi.fn().mockResolvedValue({ ok: true }),
  };
}

/**
 * Create mock IPC API for testing
 */
export function createMockIpcApi() {
  return {
    settings: {
      get: vi.fn().mockResolvedValue('default'),
      getAll: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
    fs: {
      selectDirectory: vi.fn().mockResolvedValue('/path'),
      selectFile: vi.fn().mockResolvedValue('/file.txt'),
      readDirectory: vi.fn().mockResolvedValue([]),
      readFile: vi.fn().mockResolvedValue('content'),
      getFileInfo: vi.fn().mockResolvedValue({}),
    },
    db: {
      test: createMockService(),
      providers: createMockService(),
      models: createMockService(),
      agents: createMockService(),
    },
  };
}

/**
 * Mock fetch responses for API testing
 */
export function mockFetchResponse(data: any, options: Partial<Response> = {}) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
    ...options,
  } as Response);
}

/**
 * Create a mock fetch error response
 */
export function mockFetchError(message: string, status: number = 500) {
  return Promise.resolve({
    ok: false,
    status,
    statusText: message,
    json: () => Promise.resolve({ error: message }),
    text: () => Promise.resolve(message),
    headers: new Headers(),
  } as Response);
}

/**
 * Async test helper for handling promises
 */
export async function resolvePromises(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}

/**
 * Helper to test store subscriptions
 */
export function subscribeToStore<T>(store: Writable<T>): { values: T[], unsubscribe: () => void } {
  const values: T[] = [];
  const unsubscribe = store.subscribe(value => {
    values.push(value);
  });
  
  return { values, unsubscribe };
}

/**
 * Helper to test async store updates
 */
export async function waitForStoreValue<T>(
  store: Writable<T>,
  predicate: (value: T) => boolean,
  timeout: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      unsubscribe();
      reject(new Error('Timeout waiting for store value'));
    }, timeout);
    
    const unsubscribe = store.subscribe(value => {
      if (predicate(value)) {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(value);
      }
    });
  });
}

/**
 * Mock localStorage for testing
 */
export class MockLocalStorage implements Storage {
  private store: Map<string, string> = new Map();
  
  get length(): number {
    return this.store.size;
  }
  
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] || null;
  }
  
  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }
  
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  
  removeItem(key: string): void {
    this.store.delete(key);
  }
  
  clear(): void {
    this.store.clear();
  }
}

/**
 * Setup mock localStorage for tests
 */
export function setupMockLocalStorage(): MockLocalStorage {
  const mockStorage = new MockLocalStorage();
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
  return mockStorage;
}

/**
 * Helper to test component events
 */
export function createEventListener<T = any>() {
  const events: CustomEvent<T>[] = [];
  
  return {
    handler: (event: CustomEvent<T>) => {
      events.push(event);
    },
    events,
    getLastEvent: () => events[events.length - 1],
    getEventData: (index: number = 0) => events[index]?.detail,
    clear: () => events.splice(0, events.length),
  };
}

/**
 * Helper to test component lifecycle
 */
export async function testComponentLifecycle(
  Component: ComponentType,
  props?: Record<string, any>
) {
  const { container, unmount } = render(Component, { props });
  
  // Component mounted
  expect(container.firstChild).toBeInTheDocument();
  
  // Wait for any async operations
  await waitForSvelteUpdate();
  
  // Component should still be in document
  expect(container.firstChild).toBeInTheDocument();
  
  // Unmount component
  unmount();
  
  // Component should be removed
  expect(container.firstChild).not.toBeInTheDocument();
}

/**
 * Helper to test component props updates
 */
export async function testPropUpdate<T extends Record<string, any>>(
  Component: ComponentType,
  initialProps: T,
  updatedProps: Partial<T>,
  verifyUpdate: (container: HTMLElement) => void
) {
  const { container, component } = render(Component, { props: initialProps });
  
  // Update props
  Object.assign(component, updatedProps);
  
  // Wait for update
  await waitForSvelteUpdate();
  
  // Verify update
  verifyUpdate(container);
}

// Re-export testing library utilities for convenience
export { fireEvent, waitFor, screen, within } from '@testing-library/svelte';
export { userEvent } from '@testing-library/user-event';