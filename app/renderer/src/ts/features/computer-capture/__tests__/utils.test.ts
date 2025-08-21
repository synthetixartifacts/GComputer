import { describe, test, expect } from 'vitest';
import { formatFileSize, generateScreenshotFilename, isValidDisplayId } from '../utils';

describe('Computer Capture Utils', () => {
  describe('formatFileSize', () => {
    test('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(100)).toBe('100 B');
      expect(formatFileSize(1023)).toBe('1023 B');
    });
    
    test('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(10240)).toBe('10.0 KB');
    });
    
    test('should format megabytes correctly', () => {
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(5242880)).toBe('5.0 MB');
      expect(formatFileSize(10485760)).toBe('10.0 MB');
    });
    
    test('should format gigabytes correctly', () => {
      expect(formatFileSize(1073741824)).toBe('1.0 GB');
      expect(formatFileSize(2147483648)).toBe('2.0 GB');
    });
    
    test('should handle negative values', () => {
      expect(formatFileSize(-100)).toBe('0 B');
    });
  });
  
  describe('generateScreenshotFilename', () => {
    test('should generate filename with timestamp', () => {
      const filename = generateScreenshotFilename();
      expect(filename).toMatch(/^screenshot_\d{8}_\d{6}\.png$/);
    });
    
    test('should generate unique filenames', async () => {
      const filename1 = generateScreenshotFilename();
      // Wait to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1001));
      const filename2 = generateScreenshotFilename();
      expect(filename1).not.toBe(filename2);
    });
    
    test('should include custom prefix', () => {
      const filename = generateScreenshotFilename('test');
      expect(filename).toMatch(/^test_\d{8}_\d{6}\.png$/);
    });
  });
  
  describe('isValidDisplayId', () => {
    test('should validate numeric display IDs', () => {
      expect(isValidDisplayId('1')).toBe(true);
      expect(isValidDisplayId('123')).toBe(true);
      expect(isValidDisplayId('0')).toBe(true);
    });
    
    test('should validate "all" display ID', () => {
      expect(isValidDisplayId('all')).toBe(true);
    });
    
    test('should reject invalid display IDs', () => {
      expect(isValidDisplayId('')).toBe(false);
      expect(isValidDisplayId('abc')).toBe(false);
      expect(isValidDisplayId('-1')).toBe(false);
      expect(isValidDisplayId('1.5')).toBe(false);
      expect(isValidDisplayId(null as any)).toBe(false);
      expect(isValidDisplayId(undefined as any)).toBe(false);
    });
  });
});