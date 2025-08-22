/**
 * ConfigManager Tests
 * Test suite for configuration management module
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';

// Mock modules
vi.mock('electron', () => ({
  app: {
    getAppPath: vi.fn(() => '/mock/app/path'),
  },
}));

vi.mock('node:fs');
vi.mock('dotenv');

// Don't mock path - we need it for actual path operations in tests

describe('ConfigManager', () => {
  let configManager: any;
  const mockExistsSync = fs.existsSync as MockedFunction<typeof fs.existsSync>;
  const mockConfig = dotenv.config as MockedFunction<typeof dotenv.config>;

  beforeEach(() => {
    // Reset modules before each test
    vi.resetModules();
    vi.clearAllMocks();
    
    // Reset environment variables
    process.env = {};
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', async () => {
      const module = await import('../config-manager');
      const instance1 = module.configManager;
      const instance2 = module.configManager;
      expect(instance1).toBe(instance2);
    });
  });

  describe('Configuration Loading', () => {
    beforeEach(async () => {
      const module = await import('../config-manager');
      configManager = module.configManager;
    });

    it('should load configuration from .env file', () => {
      mockExistsSync.mockReturnValue(true);
      mockConfig.mockReturnValue({
        parsed: {
          TEST_KEY: 'test_value',
          ANOTHER_KEY: 'another_value',
        },
        error: undefined,
      });

      configManager.load({ envPath: '.env' });

      expect(configManager.getEnv('TEST_KEY')).toBe('test_value');
      expect(configManager.getEnv('ANOTHER_KEY')).toBe('another_value');
    });

    it('should load secret configuration from .env_secret file', () => {
      mockExistsSync.mockReturnValue(true);
      mockConfig.mockImplementation((options?: any) => {
        if (options?.path?.includes('secret')) {
          return {
            parsed: {
              openai_key: 'secret_openai_key',
              anthropic_key: 'secret_anthropic_key',
            },
            error: undefined,
          };
        }
        return { parsed: {}, error: undefined };
      });

      configManager.load({ secretPath: '.env_secret' });

      expect(configManager.hasSecret('openai_key')).toBe(true);
      expect(configManager.hasSecret('anthropic_key')).toBe(true);
      expect(configManager.hasSecret('nonexistent_key')).toBe(false);
    });

    it('should handle missing configuration files gracefully', () => {
      mockExistsSync.mockReturnValue(false);

      expect(() => {
        configManager.load({ envPath: 'nonexistent.env' });
      }).not.toThrow();

      expect(configManager.getEnv('MISSING_KEY')).toBeUndefined();
    });

    it('should use process.env as fallback', () => {
      process.env.FALLBACK_KEY = 'fallback_value';
      mockExistsSync.mockReturnValue(false);

      configManager.load();

      expect(configManager.getEnv('FALLBACK_KEY')).toBe('fallback_value');
    });
  });

  describe('File Path Resolution', () => {
    beforeEach(async () => {
      const module = await import('../config-manager');
      configManager = module.configManager;
    });

    it('should find config file in development paths', () => {
      const mockFilePath = path.join(__dirname, '../../', '.env');
      mockExistsSync.mockImplementation((p: any) => {
        return typeof p === 'string' && p.includes('.env');
      });

      mockConfig.mockReturnValue({
        parsed: { DEV_MODE: 'true' },
        error: undefined,
      });

      process.env.NODE_ENV = 'development';
      configManager.load();

      expect(mockExistsSync).toHaveBeenCalled();
    });

    it('should find config file in production paths', () => {
      mockExistsSync.mockImplementation((p: any) => {
        return typeof p === 'string' && p.includes('.env');
      });

      mockConfig.mockReturnValue({
        parsed: { PROD_MODE: 'true' },
        error: undefined,
      });

      process.env.NODE_ENV = 'production';
      configManager.load();

      expect(mockExistsSync).toHaveBeenCalled();
    });
  });

  describe('Environment Variable Access', () => {
    beforeEach(async () => {
      const module = await import('../config-manager');
      configManager = module.configManager;
      
      mockExistsSync.mockReturnValue(true);
      mockConfig.mockReturnValue({
        parsed: {
          STRING_VAR: 'string_value',
          NUMBER_VAR: '42',
          BOOL_VAR: 'true',
        },
        error: undefined,
      });

      configManager.load();
    });

    it('should get environment variable with default value', () => {
      expect(configManager.getEnv('STRING_VAR')).toBe('string_value');
      expect(configManager.getEnv('MISSING_VAR', 'default')).toBe('default');
    });

    it('should check if environment variable exists', () => {
      expect(configManager.hasEnv('STRING_VAR')).toBe(true);
      expect(configManager.hasEnv('MISSING_VAR')).toBe(false);
    });

    it('should get public configuration', () => {
      const publicConfig = configManager.getPublicConfig();
      
      expect(publicConfig).toHaveProperty('mode');
      expect(typeof publicConfig.mode).toBe('string');
      expect(publicConfig).not.toHaveProperty('openai_key');
      expect(publicConfig).not.toHaveProperty('anthropic_key');
    });
  });

  describe('Secret Management', () => {
    beforeEach(async () => {
      const module = await import('../config-manager');
      configManager = module.configManager;
      
      mockExistsSync.mockReturnValue(true);
      mockConfig.mockImplementation((options?: any) => {
        if (options?.path?.includes('secret')) {
          return {
            parsed: {
              openai_key: 'sk-123456',
              anthropic_key: 'sk-anthropic-123',
            },
            error: undefined,
          };
        }
        return { parsed: {}, error: undefined };
      });

      configManager.load({ secretPath: '.env_secret' });
    });

    it('should check if secret exists', () => {
      expect(configManager.hasSecret('openai_key')).toBe(true);
      expect(configManager.hasSecret('anthropic_key')).toBe(true);
      expect(configManager.hasSecret('invalid_key')).toBe(false);
    });

    it('should not expose secrets in public config', () => {
      const publicConfig = configManager.getPublicConfig();
      
      expect(publicConfig).not.toHaveProperty('openai_key');
      expect(publicConfig).not.toHaveProperty('anthropic_key');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      const module = await import('../config-manager');
      configManager = module.configManager;
    });

    it('should handle dotenv parse errors gracefully', () => {
      mockExistsSync.mockReturnValue(true);
      mockConfig.mockImplementation(() => {
        throw new Error('Parse error');
      });

      expect(() => {
        configManager.load();
      }).not.toThrow();
    });

    it('should handle file system errors gracefully', () => {
      mockExistsSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      expect(() => {
        configManager.load();
      }).not.toThrow();

      expect(configManager.getEnv('ANY_KEY')).toBeUndefined();
    });
  });

  describe('Type Safety', () => {
    it('should export PublicConfig interface', async () => {
      const module = await import('../config-manager');
      
      // Check that PublicConfig type is exported
      expect(module).toHaveProperty('configManager');
      
      // The interface itself can't be tested at runtime, but we can test the shape
      const publicConfig = module.configManager.getPublicConfig();
      expect(publicConfig).toMatchObject({
        mode: expect.any(String),
      });
    });
  });

  describe('Path Caching', () => {
    beforeEach(async () => {
      const module = await import('../config-manager');
      configManager = module.configManager;
    });

    it('should cache successful file paths', () => {
      mockExistsSync.mockReturnValue(true);
      mockConfig.mockReturnValue({
        parsed: { CACHED: 'true' },
        error: undefined,
      });

      // First load
      configManager.load();
      const firstCallCount = mockExistsSync.mock.calls.length;

      // Second load with same parameters should use cache
      configManager.load();
      const secondCallCount = mockExistsSync.mock.calls.length;

      // Should not call existsSync again for cached paths
      expect(secondCallCount).toBe(firstCallCount);
    });
  });
});