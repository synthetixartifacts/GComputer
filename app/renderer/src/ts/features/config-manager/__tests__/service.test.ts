/**
 * Config Manager Service Tests
 * Test suite for configuration management service in renderer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { configManager } from '../service';
import { configManagerStore } from '../store';
import type { PublicConfig } from '../types';

// Mock environment check
vi.mock('@features/environment', () => ({
  isElectronEnvironment: vi.fn(() => true),
}));

// Mock window.gc API
const mockGcApi = {
  config: {
    getPublic: vi.fn(),
    getEnv: vi.fn(),
    hasSecret: vi.fn(),
  },
};

describe('ConfigManagerService', () => {
  const configManagerService = configManager;
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset store to initial state
    configManagerStore.set({
      publicConfig: null,
      envCache: new Map(),
      providerSecrets: new Map(),
      loading: false,
      error: null,
    });

    // Setup window.gc mock
    (global as any).window = {
      gc: mockGcApi,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = configManagerService;
      const instance2 = configManagerService;
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should load public configuration on init', async () => {
      const mockPublicConfig: PublicConfig = {
        mode: 'development',
      };
      
      mockGcApi.config.getPublic.mockResolvedValue(mockPublicConfig);

      await configManagerService.init();

      const state = get(configManagerStore);
      expect(state.publicConfig).toEqual(mockPublicConfig);
      expect(mockGcApi.config.getPublic).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Failed to load config');
      mockGcApi.config.getPublic.mockRejectedValue(error);

      await configManagerService.init();

      const state = get(configManagerStore);
      expect(state.error).toBe(error.message);
      expect(state.publicConfig).toBeNull();
    });

    it('should use fallback config in browser environment', async () => {
      const { isElectronEnvironment } = await import('@features/environment');
      vi.mocked(isElectronEnvironment).mockReturnValue(false);

      // Mock import.meta.env
      const originalEnv = import.meta.env;
      Object.defineProperty(import.meta, 'env', {
        value: { MODE: 'test' },
        configurable: true,
      });

      await configManagerService.init();

      const state = get(configManagerStore);
      expect(state.publicConfig).toEqual({ mode: 'test' });

      // Restore
      Object.defineProperty(import.meta, 'env', {
        value: originalEnv,
        configurable: true,
      });
    });

    it('should not reinitialize if already initialized', async () => {
      const mockPublicConfig: PublicConfig = {
        mode: 'production',
      };
      
      mockGcApi.config.getPublic.mockResolvedValue(mockPublicConfig);

      await configManagerService.init();
      await configManagerService.init();

      expect(mockGcApi.config.getPublic).toHaveBeenCalledTimes(1);
    });
  });

  describe('Environment Variables', () => {
    beforeEach(async () => {
      await configManagerService.init();
    });

    it('should get environment variable from cache', async () => {
      // Pre-populate cache
      configManagerStore.update(state => {
        state.envCache.set('CACHED_VAR', 'cached_value');
        return state;
      });

      const value = await configManagerService.getEnv('CACHED_VAR');

      expect(value).toBe('cached_value');
      expect(mockGcApi.config.getEnv).not.toHaveBeenCalled();
    });

    it('should fetch environment variable from main process', async () => {
      mockGcApi.config.getEnv.mockResolvedValue('fetched_value');

      const value = await configManagerService.getEnv('NEW_VAR');

      expect(value).toBe('fetched_value');
      expect(mockGcApi.config.getEnv).toHaveBeenCalledWith('NEW_VAR', undefined);
      
      // Check if cached
      const state = get(configManagerStore);
      expect(state.envCache.get('NEW_VAR')).toBe('fetched_value');
    });

    it('should use default value when variable not found', async () => {
      mockGcApi.config.getEnv.mockResolvedValue('default_value');

      const value = await configManagerService.getEnv('MISSING_VAR', 'default_value');

      expect(value).toBe('default_value');
      expect(mockGcApi.config.getEnv).toHaveBeenCalledWith('MISSING_VAR', 'default_value');
    });

    it('should return undefined in browser environment', async () => {
      const { isElectronEnvironment } = await import('@features/environment');
      vi.mocked(isElectronEnvironment).mockReturnValue(false);

      const value = await configManagerService.getEnv('ANY_VAR');

      expect(value).toBeUndefined();
      expect(mockGcApi.config.getEnv).not.toHaveBeenCalled();
    });
  });

  describe('Secret Management', () => {
    beforeEach(async () => {
      await configManagerService.init();
    });

    it('should check if provider has secret from cache', async () => {
      // Pre-populate cache
      configManagerStore.update(state => {
        state.providerSecrets.set('openai', true);
        return state;
      });

      const hasSecret = await configManagerService.hasProviderSecret('openai');

      expect(hasSecret).toBe(true);
      expect(mockGcApi.config.hasSecret).not.toHaveBeenCalled();
    });

    it('should fetch secret status from main process', async () => {
      mockGcApi.config.hasSecret.mockResolvedValue(true);

      const hasSecret = await configManagerService.hasProviderSecret('anthropic');

      expect(hasSecret).toBe(true);
      expect(mockGcApi.config.hasSecret).toHaveBeenCalledWith('anthropic');
      
      // Check if cached
      const state = get(configManagerStore);
      expect(state.providerSecrets.get('anthropic')).toBe(true);
    });

    it('should return false for invalid provider codes', async () => {
      const hasSecret = await configManagerService.hasProviderSecret('invalid-provider!');

      expect(hasSecret).toBe(false);
      expect(mockGcApi.config.hasSecret).not.toHaveBeenCalled();
    });

    it('should validate provider code format', async () => {
      const invalidCodes = ['', '../../etc/passwd', 'provider!@#', 'provider name'];
      
      for (const code of invalidCodes) {
        const hasSecret = await configManagerService.hasProviderSecret(code);
        expect(hasSecret).toBe(false);
      }

      expect(mockGcApi.config.hasSecret).not.toHaveBeenCalled();
    });

    it('should return false in browser environment', async () => {
      const { isElectronEnvironment } = await import('@features/environment');
      vi.mocked(isElectronEnvironment).mockReturnValue(false);

      const hasSecret = await configManagerService.hasProviderSecret('openai');

      expect(hasSecret).toBe(false);
      expect(mockGcApi.config.hasSecret).not.toHaveBeenCalled();
    });
  });

  describe('Public Configuration', () => {
    it('should get public configuration', async () => {
      const mockConfig: PublicConfig = {
        mode: 'production',
      };
      
      mockGcApi.config.getPublic.mockResolvedValue(mockConfig);
      await configManagerService.init();

      const config = configManagerService.getPublicConfig();

      expect(config).toEqual(mockConfig);
    });

    it('should return null if not initialized', () => {
      const config = configManagerService.getPublicConfig();

      expect(config).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle IPC errors gracefully', async () => {
      const error = new Error('IPC communication failed');
      mockGcApi.config.getEnv.mockRejectedValue(error);

      const value = await configManagerService.getEnv('ERROR_VAR');

      expect(value).toBeUndefined();
    });

    it('should handle missing window.gc API', async () => {
      (global as any).window = {};

      const value = await configManagerService.getEnv('ANY_VAR');
      
      expect(value).toBeUndefined();
    });
  });

  describe('Cache Management', () => {
    it('should cache environment variables', async () => {
      mockGcApi.config.getEnv.mockResolvedValue('value1');

      // First call - should fetch
      await configManagerService.getEnv('VAR1');
      expect(mockGcApi.config.getEnv).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await configManagerService.getEnv('VAR1');
      expect(mockGcApi.config.getEnv).toHaveBeenCalledTimes(1);
    });

    it('should cache provider secret status', async () => {
      mockGcApi.config.hasSecret.mockResolvedValue(true);

      // First call - should fetch
      await configManagerService.hasProviderSecret('openai');
      expect(mockGcApi.config.hasSecret).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await configManagerService.hasProviderSecret('openai');
      expect(mockGcApi.config.hasSecret).toHaveBeenCalledTimes(1);
    });
  });
});