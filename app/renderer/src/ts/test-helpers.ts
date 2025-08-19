import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import { writable } from 'svelte/store';

/**
 * Test utilities for Svelte component testing
 */

// Mock store creator for testing
export function createMockStore<T>(initialValue: T) {
  const { subscribe, set, update } = writable(initialValue);
  return {
    subscribe,
    set: vi.fn(set),
    update: vi.fn(update),
  };
}

// Mock window.gc API for component tests
export function setupComponentMocks() {
  if (typeof window !== 'undefined' && !window.gc) {
    window.gc = {
      settings: {
        get: vi.fn().mockResolvedValue('default'),
        getAll: vi.fn().mockResolvedValue({
          locale: 'en',
          themeMode: 'light',
        }),
        set: vi.fn().mockResolvedValue(undefined),
      },
      fs: {
        selectDirectory: vi.fn().mockResolvedValue('/test/dir'),
        selectFile: vi.fn().mockResolvedValue('/test/file.txt'),
        readDirectory: vi.fn().mockResolvedValue([]),
        readFile: vi.fn().mockResolvedValue('content'),
        getFileInfo: vi.fn().mockResolvedValue({
          name: 'test.txt',
          path: '/test/test.txt',
          size: 100,
          isDirectory: false,
        }),
      },
      db: {
        test: {
          list: vi.fn().mockResolvedValue([]),
          create: vi.fn().mockResolvedValue({ id: 1 }),
          update: vi.fn().mockResolvedValue({ id: 1 }),
          delete: vi.fn().mockResolvedValue({ ok: true }),
        },
        providers: {
          list: vi.fn().mockResolvedValue([]),
          create: vi.fn().mockResolvedValue({ id: 1 }),
          update: vi.fn().mockResolvedValue({ id: 1 }),
          delete: vi.fn().mockResolvedValue({ ok: true }),
        },
        models: {
          list: vi.fn().mockResolvedValue([]),
          create: vi.fn().mockResolvedValue({ id: 1 }),
          update: vi.fn().mockResolvedValue({ id: 1 }),
          delete: vi.fn().mockResolvedValue({ ok: true }),
        },
        agents: {
          list: vi.fn().mockResolvedValue([]),
          create: vi.fn().mockResolvedValue({ id: 1 }),
          update: vi.fn().mockResolvedValue({ id: 1 }),
          delete: vi.fn().mockResolvedValue({ ok: true }),
        },
      },
    };
  }
}

// Helper to test async component behavior
export async function testAsyncComponent(
  component: any,
  props: any,
  testFn: (container: HTMLElement) => Promise<void>
) {
  const { container } = render(component, props);
  await waitFor(() => testFn(container));
}

// Helper to test component events
export async function testComponentEvent(
  component: any,
  props: any,
  eventName: string,
  triggerFn: (container: HTMLElement) => void
) {
  const mockHandler = vi.fn();
  const { container } = render(component, {
    ...props,
    [`on${eventName}`]: mockHandler,
  });
  
  triggerFn(container);
  await waitFor(() => expect(mockHandler).toHaveBeenCalled());
  
  return mockHandler;
}

// Helper to test component slots
export function testComponentSlot(
  component: any,
  props: any,
  slotContent: string,
  slotName?: string
) {
  const slots = slotName 
    ? { [slotName]: slotContent }
    : { default: slotContent };
    
  const { container } = render(component, { props, slots });
  expect(container.textContent).toContain(slotContent);
  
  return container;
}

// Helper to simulate file selection
export function mockFileSelection(files: File[]) {
  return {
    target: {
      files: {
        length: files.length,
        item: (i: number) => files[i],
        ...files.reduce((acc, file, i) => ({ ...acc, [i]: file }), {}),
      },
    },
  };
}

// Helper to create mock File objects
export function createMockFile(name: string, content: string, type: string = 'text/plain'): File {
  return new File([content], name, { type });
}

// Helper to wait for store updates
export async function waitForStore<T>(store: any, predicate: (value: T) => boolean) {
  return new Promise((resolve) => {
    const unsubscribe = store.subscribe((value: T) => {
      if (predicate(value)) {
        unsubscribe();
        resolve(value);
      }
    });
  });
}