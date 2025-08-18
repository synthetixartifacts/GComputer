import { describe, test, expect, beforeEach, vi } from 'vitest';
import { 
  getAllSettings, 
  getSetting, 
  setSetting, 
  clearSettingsCache,
  type AppSettings,
  type ThemeMode,
  type Locale 
} from '../settings';
import { app } from 'electron';
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';

// Mock Electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => '/mock/userData'),
  },
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
  },
  ipcMain: {
    handle: vi.fn(),
  },
}));

// Mock file system
vi.mock('node:fs/promises', () => {
  const mockReadFile = vi.fn();
  const mockWriteFile = vi.fn().mockResolvedValue(undefined);
  const mockMkdir = vi.fn().mockResolvedValue(undefined);
  const mockRename = vi.fn().mockResolvedValue(undefined);
  
  return {
    default: {
      readFile: mockReadFile,
      writeFile: mockWriteFile,
      mkdir: mockMkdir,
      rename: mockRename,
    },
    readFile: mockReadFile,
    writeFile: mockWriteFile,
    mkdir: mockMkdir,
    rename: mockRename,
  };
});

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('node:path', () => ({
  default: {
    join: vi.fn((...args) => args.join('/')),
    dirname: vi.fn((p) => p.split('/').slice(0, -1).join('/')),
  },
  join: vi.fn((...args) => args.join('/')),
  dirname: vi.fn((p) => p.split('/').slice(0, -1).join('/')),
}));

// Mock menu module to avoid circular dependency
vi.mock('../menu', () => ({
  setApplicationMenuForLocale: vi.fn(),
}));

describe('Settings System', () => {
  const mockUserDataPath = '/mock/userData';
  const mockSettingsPath = '/mock/userData/settings.json';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Clear the settings cache between tests
    clearSettingsCache();
    
    // Setup default mocks
    vi.mocked(app.getPath).mockReturnValue(mockUserDataPath);
    vi.mocked(path.join).mockReturnValue(mockSettingsPath);
    vi.mocked(path.dirname).mockReturnValue(mockUserDataPath);
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.rename).mockResolvedValue(undefined);
  });

  const defaultSettings: AppSettings = {
    version: 1,
    locale: 'en',
    themeMode: 'light',
  };

  describe('getAllSettings', () => {
    test('should return default settings when file does not exist', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT: File not found'));

      const settings = await getAllSettings();

      expect(settings).toEqual(defaultSettings);
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.tmp'),
        JSON.stringify(defaultSettings, null, 2),
        'utf8'
      );
      expect(fs.rename).toHaveBeenCalled();
    });

    test('should return cached settings on subsequent calls', async () => {
      const mockSettings = {
        version: 1,
        locale: 'fr' as Locale,
        themeMode: 'dark' as ThemeMode,
      };
      
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSettings));

      // First call should read from disk
      const settings1 = await getAllSettings();
      expect(fs.readFile).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const settings2 = await getAllSettings();
      expect(fs.readFile).toHaveBeenCalledTimes(1); // Still only called once
      
      expect(settings1).toEqual(mockSettings);
      expect(settings2).toEqual(mockSettings);
    });

    test('should migrate invalid settings', async () => {
      const invalidSettings = {
        version: 0,
        locale: 'invalid',
        themeMode: 'invalid',
        extraField: 'should be removed',
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(invalidSettings));

      const settings = await getAllSettings();

      expect(settings).toEqual({
        version: 1, // migrated to current version
        locale: 'en', // invalid locale reset to default
        themeMode: 'light', // invalid theme reset to default
        // extraField should be removed
      });
    });

    test('should handle corrupted JSON file', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('invalid json {');

      const settings = await getAllSettings();

      expect(settings).toEqual(defaultSettings);
      expect(fs.writeFile).toHaveBeenCalled(); // Should write defaults
    });

    test('should preserve valid settings during migration', async () => {
      const validSettings = {
        version: 0, // old version
        locale: 'fr',
        themeMode: 'dark',
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(validSettings));

      const settings = await getAllSettings();

      expect(settings).toEqual({
        version: 1, // updated version
        locale: 'fr', // preserved
        themeMode: 'dark', // preserved
      });
    });
  });

  describe('getSetting', () => {
    test('should get individual setting values', async () => {
      const mockSettings = {
        version: 1,
        locale: 'fr' as Locale,
        themeMode: 'dark' as ThemeMode,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSettings));

      const locale = await getSetting('locale');
      const themeMode = await getSetting('themeMode');
      const version = await getSetting('version');

      expect(locale).toBe('fr');
      expect(themeMode).toBe('dark');
      expect(version).toBe(1);
    });

    test('should handle file read errors gracefully', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Permission denied'));

      const locale = await getSetting('locale');

      expect(locale).toBe('en'); // Should return default
    });
  });

  describe('setSetting', () => {
    beforeEach(() => {
      // Setup initial valid settings
      const initialSettings = {
        version: 1,
        locale: 'en' as Locale,
        themeMode: 'light' as ThemeMode,
      };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(initialSettings));
    });

    test('should update locale setting', async () => {
      const result = await setSetting('locale', 'fr');

      expect(result).toEqual({
        version: 1,
        locale: 'fr',
        themeMode: 'light',
      });

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.tmp'),
        expect.stringContaining('"locale": "fr"'),
        'utf8'
      );
      expect(fs.rename).toHaveBeenCalled();
    });

    test('should update themeMode setting', async () => {
      const result = await setSetting('themeMode', 'dark');

      expect(result).toEqual({
        version: 1,
        locale: 'en',
        themeMode: 'dark',
      });

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.tmp'),
        expect.stringContaining('"themeMode": "dark"'),
        'utf8'
      );
    });

    test('should reject invalid locale values', async () => {
      await expect(setSetting('locale', 'invalid' as Locale))
        .rejects.toThrow('Invalid locale');

      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    test('should reject invalid themeMode values', async () => {
      await expect(setSetting('themeMode', 'invalid' as ThemeMode))
        .rejects.toThrow('Invalid themeMode');

      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    test('should reject version updates', async () => {
      await expect(setSetting('version', 2))
        .rejects.toThrow('version is managed internally');

      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    test('should handle file write errors', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Disk full'));

      await expect(setSetting('locale', 'fr'))
        .rejects.toThrow('Disk full');
    });

    test('should update cache after successful write', async () => {
      // Set a new locale
      await setSetting('locale', 'fr');

      // Clear file read mock to ensure we're using cache
      vi.mocked(fs.readFile).mockClear();

      // Get settings should use cached value
      const settings = await getAllSettings();
      expect(settings.locale).toBe('fr');
      expect(fs.readFile).not.toHaveBeenCalled();
    });
  });

  describe('atomic file writing', () => {
    test('should write to temporary file then rename', async () => {
      const settings = {
        version: 1,
        locale: 'en' as Locale,
        themeMode: 'light' as ThemeMode,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(settings));

      await setSetting('themeMode', 'dark');

      expect(fs.writeFile).toHaveBeenCalledWith(
        `${mockSettingsPath}.tmp`,
        expect.any(String),
        'utf8'
      );
      expect(fs.rename).toHaveBeenCalledWith(
        `${mockSettingsPath}.tmp`,
        mockSettingsPath
      );
    });

    test('should create directory if it does not exist', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT'));

      await getAllSettings();

      expect(fs.mkdir).toHaveBeenCalledWith(mockUserDataPath, { recursive: true });
    });
  });

  describe('validation functions', () => {
    // We can't directly test the validation functions since they're not exported,
    // but we can test their behavior through setSetting

    test('should validate locale correctly', async () => {
      const validSettings = {
        version: 1,
        locale: 'en' as Locale,
        themeMode: 'light' as ThemeMode,
      };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(validSettings));

      // Valid locales
      await expect(setSetting('locale', 'en')).resolves.toBeDefined();
      await expect(setSetting('locale', 'fr')).resolves.toBeDefined();

      // Invalid locale
      await expect(setSetting('locale', 'es' as Locale))
        .rejects.toThrow('Invalid locale');
    });

    test('should validate themeMode correctly', async () => {
      const validSettings = {
        version: 1,
        locale: 'en' as Locale,
        themeMode: 'light' as ThemeMode,
      };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(validSettings));

      // Valid theme modes
      await expect(setSetting('themeMode', 'light')).resolves.toBeDefined();
      await expect(setSetting('themeMode', 'dark')).resolves.toBeDefined();
      await expect(setSetting('themeMode', 'fun')).resolves.toBeDefined();

      // Invalid theme mode
      await expect(setSetting('themeMode', 'auto' as ThemeMode))
        .rejects.toThrow('Invalid themeMode');
    });
  });

  describe('settings path generation', () => {
    test('should use correct userData path', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT'));

      await getAllSettings();

      expect(app.getPath).toHaveBeenCalledWith('userData');
      expect(path.join).toHaveBeenCalledWith(mockUserDataPath, 'settings.json');
    });
  });

  describe('settings format', () => {
    test('should write properly formatted JSON', async () => {
      const settings = {
        version: 1,
        locale: 'en' as Locale,
        themeMode: 'light' as ThemeMode,
      };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(settings));

      await setSetting('locale', 'fr');

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const writtenContent = writeCall[1] as string;
      
      // Should be formatted JSON
      expect(writtenContent).toContain('\n');
      expect(writtenContent).toContain('  '); // Should have indentation
      
      // Should be valid JSON
      expect(() => JSON.parse(writtenContent)).not.toThrow();
      
      const parsed = JSON.parse(writtenContent);
      expect(parsed.locale).toBe('fr');
    });
  });

  describe('concurrent access handling', () => {
    test('should handle multiple simultaneous getSetting calls', async () => {
      const mockSettings = {
        version: 1,
        locale: 'fr' as Locale,
        themeMode: 'dark' as ThemeMode,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSettings));

      // Multiple concurrent calls
      const [locale1, locale2, theme1, theme2] = await Promise.all([
        getSetting('locale'),
        getSetting('locale'),
        getSetting('themeMode'),
        getSetting('themeMode'),
      ]);

      expect(locale1).toBe('fr');
      expect(locale2).toBe('fr');
      expect(theme1).toBe('dark');
      expect(theme2).toBe('dark');
      
      // Should read file at least once (concurrent access may cause multiple reads)
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('settings.json'),
        'utf8'
      );
    });
  });
});