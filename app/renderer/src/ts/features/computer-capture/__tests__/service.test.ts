import { describe, test, expect, beforeEach, vi } from 'vitest';
import { 
  captureScreen, 
  captureDisplay, 
  captureAllDisplays,
  getAvailableDisplays,
  loadScreenshots,
  deleteScreenshot
} from '../service';

// Mock the window.gc API
const mockScreenAPI = {
  capture: vi.fn(),
  captureDisplay: vi.fn(),
  captureAll: vi.fn(),
  getDisplays: vi.fn(),
  getSources: vi.fn(),
  list: vi.fn(),
  delete: vi.fn(),
  get: vi.fn(),
  setPreviewDisplay: vi.fn()
};

// Setup global mock
global.window = {
  gc: {
    screen: mockScreenAPI
  }
} as any;

describe('Computer Capture Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('captureScreen', () => {
    test('should capture screen successfully', async () => {
      const mockResult = {
        id: 'ps_20240101_120000',
        filename: 'ps_20240101_120000.png',
        path: '/screenshots/ps_20240101_120000.png',
        size: 1024000,
        createdAt: Date.now(),
        width: 1920,
        height: 1080
      };
      
      mockScreenAPI.capture.mockResolvedValue(mockResult);
      
      await captureScreen();
      
      expect(mockScreenAPI.capture).toHaveBeenCalledWith(undefined);
    });
    
    test('should handle capture with custom save path', async () => {
      const customPath = '/custom/path';
      mockScreenAPI.capture.mockResolvedValue({});
      
      await captureScreen({ savePath: customPath });
      
      expect(mockScreenAPI.capture).toHaveBeenCalledWith({ savePath: customPath });
    });
    
    test('should handle capture errors', async () => {
      mockScreenAPI.capture.mockRejectedValue(new Error('Capture failed'));
      
      // captureScreen doesn't throw, it sets error in store
      await captureScreen();
      expect(mockScreenAPI.capture).toHaveBeenCalled();
    });
  });
  
  describe('captureDisplay', () => {
    test('should capture specific display', async () => {
      const mockResult = {
        id: 'ps_20240101_120000',
        filename: 'ps_20240101_120000.png',
        displayId: '1'
      };
      
      mockScreenAPI.captureDisplay.mockResolvedValue(mockResult);
      
      const result = await captureDisplay('1');
      
      expect(mockScreenAPI.captureDisplay).toHaveBeenCalledWith('1', undefined);
      expect(result.displayId).toBe('1');
    });
    
    test('should validate display ID before capture', async () => {
      await expect(captureDisplay('')).rejects.toThrow('Invalid display ID');
      await expect(captureDisplay('invalid')).rejects.toThrow('Invalid display ID');
      
      expect(mockScreenAPI.captureDisplay).not.toHaveBeenCalled();
    });
  });
  
  describe('captureAllDisplays', () => {
    test('should capture all displays', async () => {
      const mockResults = [
        { id: '1', filename: 'screen1.png' },
        { id: '2', filename: 'screen2.png' }
      ];
      
      mockScreenAPI.captureAll.mockResolvedValue(mockResults);
      
      const results = await captureAllDisplays();
      
      expect(mockScreenAPI.captureAll).toHaveBeenCalledWith(undefined);
      expect(results).toHaveLength(2);
    });
  });
  
  describe('getAvailableDisplays', () => {
    test('should return available displays', async () => {
      const mockDisplays = [
        { id: '1', name: 'Primary Display', isPrimary: true },
        { id: '2', name: 'Display 2', isPrimary: false }
      ];
      
      mockScreenAPI.getDisplays.mockResolvedValue(mockDisplays);
      
      const displays = await getAvailableDisplays();
      
      expect(mockScreenAPI.getDisplays).toHaveBeenCalled();
      expect(displays).toEqual(mockDisplays);
    });
    
    test('should handle no displays available', async () => {
      mockScreenAPI.getDisplays.mockResolvedValue([]);
      
      const displays = await getAvailableDisplays();
      
      expect(displays).toEqual([]);
    });
  });
  
  describe('loadScreenshots', () => {
    test('should load screenshots', async () => {
      const mockScreenshots = [
        { 
          id: '1',
          filename: 'screenshot1.png', 
          path: '/path/screenshot1.png',
          size: 1024000,
          createdAt: Date.now(),
          width: 1920,
          height: 1080
        },
        { 
          id: '2',
          filename: 'screenshot2.png',
          path: '/path/screenshot2.png', 
          size: 2048000,
          createdAt: Date.now(),
          width: 1920,
          height: 1080
        }
      ];
      
      mockScreenAPI.list.mockResolvedValue(mockScreenshots);
      
      await loadScreenshots();
      
      expect(mockScreenAPI.list).toHaveBeenCalled();
    });
    
    test('should handle loading errors', async () => {
      mockScreenAPI.list.mockRejectedValue(new Error('Load failed'));
      
      // loadScreenshots doesn't throw, it sets error in store
      await loadScreenshots();
      
      expect(mockScreenAPI.list).toHaveBeenCalled();
    });
  });
  
  describe('deleteScreenshot', () => {
    test('should delete screenshot successfully', async () => {
      mockScreenAPI.delete.mockResolvedValue(true);
      
      const result = await deleteScreenshot('screenshot.png', 'screenshot_id');
      
      expect(mockScreenAPI.delete).toHaveBeenCalledWith('screenshot.png');
      expect(result).toBe(true);
    });
    
    test('should handle delete failure', async () => {
      mockScreenAPI.delete.mockResolvedValue(false);
      
      const result = await deleteScreenshot('nonexistent.png', 'nonexistent_id');
      
      expect(result).toBe(false);
    });
    
    test('should validate filename before deletion', async () => {
      await expect(deleteScreenshot('', 'id')).rejects.toThrow('Invalid filename');
      await expect(deleteScreenshot('../../../etc/passwd', 'id')).rejects.toThrow('Invalid filename');
      
      expect(mockScreenAPI.delete).not.toHaveBeenCalled();
    });
  });
});