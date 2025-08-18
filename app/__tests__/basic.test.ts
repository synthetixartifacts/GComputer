import { describe, test, expect } from 'vitest';

describe('Basic Test Setup', () => {
  test('should run basic assertions', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toBe('hello');
    expect(true).toBeTruthy();
  });

  test('should handle async operations', async () => {
    const promise = Promise.resolve(42);
    const result = await promise;
    expect(result).toBe(42);
  });

  test('should work with objects', () => {
    const obj = { name: 'test', value: 123 };
    expect(obj).toEqual({ name: 'test', value: 123 });
    expect(obj).toHaveProperty('name');
    expect(obj.name).toBe('test');
  });

  test('should work with arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
    expect(arr[0]).toBe(1);
  });
});