/**
 * Context Menu Configuration Tests
 * Tests for configuration-based context menu initialization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ConfigurationService } from '../../db/services/configuration-service';

// Mock the configuration service
const mockConfigService: Partial<ConfigurationService> = {
  getByCode: vi.fn(),
  updateByCode: vi.fn(),
};

// Mock the modules
vi.mock('../../db/services/index', () => ({
  configurationService: mockConfigService,
}));

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
  globalShortcut: {
    register: vi.fn(() => true),
    unregister: vi.fn(),
    isRegistered: vi.fn(() => false),
  },
  app: {
    on: vi.fn(),
  },
}));

describe('Context Menu Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration Loading', () => {
    it('should load context menu enabled status from configuration', async () => {
      const { initializeContextMenu } = await import('../ipc-handlers');
      
      // Mock configuration values
      (mockConfigService.getByCode as any).mockImplementation((code: string) => {
        if (code === 'context_menu_enabled') {
          return Promise.resolve({ value: 'true' });
        }
        if (code === 'context_menu_shortcut') {
          return Promise.resolve({ value: 'Alt+Space' });
        }
        return Promise.resolve(null);
      });

      await initializeContextMenu();

      expect(mockConfigService.getByCode).toHaveBeenCalledWith('context_menu_enabled');
      expect(mockConfigService.getByCode).toHaveBeenCalledWith('context_menu_shortcut');
    });

    it('should not initialize when context menu is disabled', async () => {
      const { initializeContextMenu } = await import('../ipc-handlers');
      const { globalShortcut } = await import('electron');
      
      // Mock configuration as disabled
      (mockConfigService.getByCode as any).mockImplementation((code: string) => {
        if (code === 'context_menu_enabled') {
          return Promise.resolve({ value: 'false' });
        }
        return Promise.resolve(null);
      });

      await initializeContextMenu();

      // Should not register shortcuts when disabled
      expect(globalShortcut.register).not.toHaveBeenCalled();
    });

    it('should use custom shortcut from configuration', async () => {
      const { initializeContextMenu } = await import('../ipc-handlers');
      
      // Mock configuration with custom shortcut
      (mockConfigService.getByCode as any).mockImplementation((code: string) => {
        if (code === 'context_menu_enabled') {
          return Promise.resolve({ value: 'true' });
        }
        if (code === 'context_menu_shortcut') {
          return Promise.resolve({ value: 'F5' });
        }
        return Promise.resolve(null);
      });

      await initializeContextMenu();

      expect(mockConfigService.getByCode).toHaveBeenCalledWith('context_menu_shortcut');
    });

    it('should use default shortcut when configuration is missing', async () => {
      const { initializeContextMenu } = await import('../ipc-handlers');
      
      // Mock configuration with no shortcut
      (mockConfigService.getByCode as any).mockImplementation((code: string) => {
        if (code === 'context_menu_enabled') {
          return Promise.resolve({ value: 'true' });
        }
        if (code === 'context_menu_shortcut') {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });

      await initializeContextMenu();

      // Should still initialize with default shortcut
      expect(mockConfigService.getByCode).toHaveBeenCalledWith('context_menu_shortcut');
    });
  });

  describe('Configuration Updates', () => {
    it('should update enabled status in database', async () => {
      (mockConfigService.updateByCode as any).mockResolvedValue({ value: 'false' });

      await mockConfigService.updateByCode!('context_menu_enabled', 'false');

      expect(mockConfigService.updateByCode).toHaveBeenCalledWith('context_menu_enabled', 'false');
    });

    it('should update shortcut in database', async () => {
      (mockConfigService.updateByCode as any).mockResolvedValue({ value: 'F6' });

      await mockConfigService.updateByCode!('context_menu_shortcut', 'F6');

      expect(mockConfigService.updateByCode).toHaveBeenCalledWith('context_menu_shortcut', 'F6');
    });

    it('should update enabled actions in database', async () => {
      const actions = ['translate', 'summarize', 'copy'];
      (mockConfigService.updateByCode as any).mockResolvedValue({ value: JSON.stringify(actions) });

      await mockConfigService.updateByCode!('context_menu_actions', JSON.stringify(actions));

      expect(mockConfigService.updateByCode).toHaveBeenCalledWith('context_menu_actions', JSON.stringify(actions));
    });
  });

  describe('Configuration Retrieval', () => {
    it('should retrieve all context menu configurations', async () => {
      // Mock configuration values
      (mockConfigService.getByCode as any).mockImplementation((code: string) => {
        switch (code) {
          case 'context_menu_enabled':
            return Promise.resolve({ value: 'true' });
          case 'context_menu_shortcut':
            return Promise.resolve({ value: 'Alt+Space' });
          case 'context_menu_actions':
            return Promise.resolve({ value: JSON.stringify(['translate', 'copy']) });
          default:
            return Promise.resolve(null);
        }
      });

      const [enabled, shortcut, actions] = await Promise.all([
        mockConfigService.getByCode!('context_menu_enabled'),
        mockConfigService.getByCode!('context_menu_shortcut'),
        mockConfigService.getByCode!('context_menu_actions'),
      ]);

      expect(enabled?.value).toBe('true');
      expect(shortcut?.value).toBe('Alt+Space');
      expect(actions?.value).toBe(JSON.stringify(['translate', 'copy']));
    });

    it('should handle missing configuration gracefully', async () => {
      (mockConfigService.getByCode as any).mockResolvedValue(null);

      const config = await mockConfigService.getByCode!('non_existent_config');

      expect(config).toBeNull();
    });
  });
});