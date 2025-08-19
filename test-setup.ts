import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Setup DOM environment for Svelte 5
Object.defineProperty(global, 'CSS', { value: { supports: () => false } });
Object.defineProperty(global, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});

// Force client-side mode for Svelte 5
if (typeof global !== 'undefined') {
  // Ensure window and document are available
  global.window = global.window || {};
  global.document = global.document || {};
  
  // Set browser environment detection
  global.navigator = global.navigator || { userAgent: 'Mozilla/5.0 (Node.js)' };
  
  // Mock browser APIs
  global.requestAnimationFrame = global.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
  global.cancelAnimationFrame = global.cancelAnimationFrame || clearTimeout;
  
  // Force browser mode - tell Svelte this is not a server environment
  process.env.NODE_ENV = 'test';
  delete process.env.SSR;
  
  // Mock performance API
  global.performance = global.performance || {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
  };
}

// Mock Svelte lifecycle functions
vi.mock('svelte', async () => {
  const actual = await vi.importActual('svelte') as any;
  return {
    ...actual,
    onMount: vi.fn((fn) => {
      if (typeof fn === 'function') {
        setTimeout(fn, 0);
      }
    }),
    onDestroy: vi.fn((fn) => {
      if (typeof fn === 'function') {
        // Store cleanup function for later cleanup if needed
        return fn;
      }
    }),
    beforeUpdate: vi.fn((fn) => {
      if (typeof fn === 'function') {
        setTimeout(fn, 0);
      }
    }),
    afterUpdate: vi.fn((fn) => {
      if (typeof fn === 'function') {
        setTimeout(fn, 0);
      }
    }),
    tick: vi.fn(() => Promise.resolve()),
  };
});

// Setup test environment
beforeAll(() => {
  // Mock console methods to reduce noise in tests
  global.console = {
    ...console,
    error: vi.fn(),
    warn: vi.fn(),
    // Keep log and info for debugging
    log: console.log,
    info: console.info,
  };
});

// Mock Electron APIs for main process tests
vi.mock('electron', () => {
  const mockBrowserWindow = vi.fn().mockImplementation(() => ({
    loadURL: vi.fn(),
    loadFile: vi.fn(),
    webContents: {
      send: vi.fn(),
      on: vi.fn(),
    },
    on: vi.fn(),
    once: vi.fn(),
    removeAllListeners: vi.fn(),
    close: vi.fn(),
  }));
  
  // Add static method getAllWindows
  mockBrowserWindow.getAllWindows = vi.fn().mockReturnValue([]);
  
  return {
    app: {
      getPath: vi.fn((name: string) => `/mock/userData`),
      whenReady: vi.fn(() => Promise.resolve()),
      quit: vi.fn(),
      on: vi.fn(),
    },
    BrowserWindow: mockBrowserWindow,
    ipcMain: {
      handle: vi.fn(),
      on: vi.fn(),
      removeHandler: vi.fn(),
    },
    Menu: {
      buildFromTemplate: vi.fn(),
      setApplicationMenu: vi.fn(),
    },
    dialog: {
      showOpenDialog: vi.fn(),
      showSaveDialog: vi.fn(),
      showMessageBox: vi.fn(),
    },
  };
});

// Mock window.gc API for renderer tests
if (typeof window !== 'undefined') {
  // Create a complete mock of the window.gc API
  window.gc = {
    // Settings API
    settings: {
      get: vi.fn().mockResolvedValue('default'),
      getAll: vi.fn().mockResolvedValue({
        locale: 'en',
        theme: 'light',
        defaultPath: '/home/user',
      }),
      set: vi.fn().mockResolvedValue(undefined),
    },
    
    // File system API
    fs: {
      selectDirectory: vi.fn().mockResolvedValue('/selected/directory'),
      selectFile: vi.fn().mockResolvedValue('/selected/file.txt'),
      readDirectory: vi.fn().mockResolvedValue([
        { name: 'file1.txt', path: '/dir/file1.txt', isDirectory: false },
        { name: 'folder1', path: '/dir/folder1', isDirectory: true },
      ]),
      readFile: vi.fn().mockResolvedValue('file contents'),
      getFileInfo: vi.fn().mockResolvedValue({
        name: 'file.txt',
        path: '/path/to/file.txt',
        size: 1024,
        isDirectory: false,
        createdAt: new Date('2024-01-01'),
        modifiedAt: new Date('2024-01-01'),
      }),
    },
    
    // Database API with all entities
    db: {
      // Test table
      test: {
        list: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({ id: 1 }),
        update: vi.fn().mockResolvedValue({ id: 1 }),
        delete: vi.fn().mockResolvedValue({ ok: true }),
      },
      
      // AI Providers
      providers: {
        list: vi.fn().mockResolvedValue([
          {
            id: 1,
            code: 'openai',
            name: 'OpenAI',
            url: 'https://api.openai.com',
            authentication: 'bearer',
            secretKey: null,
            configuration: '{}',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ]),
        create: vi.fn().mockResolvedValue({ id: 1 }),
        update: vi.fn().mockResolvedValue({ id: 1 }),
        delete: vi.fn().mockResolvedValue({ ok: true }),
      },
      
      // AI Models
      models: {
        list: vi.fn().mockResolvedValue([
          {
            id: 1,
            code: 'gpt-4',
            name: 'GPT-4',
            providerId: 1,
            provider: {
              id: 1,
              code: 'openai',
              name: 'OpenAI',
            },
            configuration: '{}',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ]),
        create: vi.fn().mockResolvedValue({ id: 1 }),
        update: vi.fn().mockResolvedValue({ id: 1 }),
        delete: vi.fn().mockResolvedValue({ ok: true }),
      },
      
      // AI Agents
      agents: {
        list: vi.fn().mockResolvedValue([
          {
            id: 1,
            code: 'assistant',
            name: 'AI Assistant',
            modelId: 1,
            model: {
              id: 1,
              code: 'gpt-4',
              name: 'GPT-4',
              provider: {
                id: 1,
                code: 'openai',
                name: 'OpenAI',
              },
            },
            systemMessage: 'You are a helpful assistant',
            configuration: '{}',
            isActive: true,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ]),
        create: vi.fn().mockResolvedValue({ id: 1 }),
        update: vi.fn().mockResolvedValue({ id: 1 }),
        delete: vi.fn().mockResolvedValue({ ok: true }),
      },
    },
  };
  
  // Mock other browser APIs that might be used
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  
  // Mock fetch for API calls
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(''),
    headers: new Headers(),
  } as Response);
}

// Mock Node.js modules for main process tests
if (typeof window === 'undefined') {
  // Mock fs module with promises
  vi.mock('node:fs', () => {
    const mockFs = {
      existsSync: vi.fn().mockReturnValue(true),
      readFileSync: vi.fn().mockReturnValue('{}'),
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
      readdirSync: vi.fn().mockReturnValue([]),
      statSync: vi.fn().mockReturnValue({
        isDirectory: () => false,
        isFile: () => true,
        size: 1024,
        mtime: new Date(),
        ctime: new Date(),
      }),
      promises: {
        readFile: vi.fn().mockResolvedValue('{"version":1,"locale":"en","themeMode":"light"}'),
        writeFile: vi.fn().mockResolvedValue(undefined),
        mkdir: vi.fn().mockResolvedValue(undefined),
        rename: vi.fn().mockResolvedValue(undefined),
        access: vi.fn().mockResolvedValue(undefined),
        stat: vi.fn().mockResolvedValue({
          isDirectory: () => false,
          isFile: () => true,
          size: 1024,
          mtime: new Date(),
          ctime: new Date(),
        }),
      },
    };
    
    return {
      default: mockFs,
      ...mockFs,
    };
  });
  
  // Mock path module
  vi.mock('node:path', () => ({
    join: vi.fn((...args) => args.join('/')),
    resolve: vi.fn((...args) => args.join('/')),
    dirname: vi.fn((p) => p.split('/').slice(0, -1).join('/')),
    basename: vi.fn((p) => p.split('/').pop()),
    extname: vi.fn((p) => {
      const parts = p.split('.');
      return parts.length > 1 ? `.${parts.pop()}` : '';
    }),
  }));
}

// Mock sql.js for database tests
vi.mock('sql.js', () => ({
  default: vi.fn().mockResolvedValue({
    Database: vi.fn().mockImplementation(() => ({
      run: vi.fn(),
      exec: vi.fn().mockReturnValue([]),
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn(),
        step: vi.fn(),
        get: vi.fn(),
        run: vi.fn(),
        free: vi.fn(),
      }),
      close: vi.fn(),
      export: vi.fn().mockReturnValue(new Uint8Array()),
    })),
  }),
}));

// Mock Express for API server tests
vi.mock('express', () => ({
  default: vi.fn(() => ({
    use: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    listen: vi.fn((port, callback) => {
      if (callback) callback();
      return { close: vi.fn() };
    }),
  })),
  json: vi.fn(),
  urlencoded: vi.fn(),
}));

// Mock CORS
vi.mock('cors', () => ({
  default: vi.fn(() => (req: any, res: any, next: any) => next()),
}));

// Helper functions for tests
export const mockStore = <T>(initialValue: T) => {
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
};

// Helper to wait for async operations
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

// Helper to create mock IPC handler
export const createMockIpcHandler = () => {
  const handlers = new Map<string, Function>();
  
  return {
    handle: vi.fn((channel: string, handler: Function) => {
      handlers.set(channel, handler);
    }),
    invoke: vi.fn(async (channel: string, ...args: any[]) => {
      const handler = handlers.get(channel);
      if (handler) {
        return handler({}, ...args);
      }
      throw new Error(`No handler for channel: ${channel}`);
    }),
    handlers,
  };
};

// Reset all mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});