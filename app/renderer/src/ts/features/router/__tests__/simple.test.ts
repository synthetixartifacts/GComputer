import { describe, test, expect, beforeEach, vi } from 'vitest';

// Test the router functionality with minimal mocking
describe('Router Types and Constants', () => {
  test('should have correct route types', async () => {
    // Import types dynamically to test module loading
    const { ROUTES } = await import('../types');
    
    expect(ROUTES).toBeDefined();
    expect(Array.isArray(ROUTES)).toBe(true);
    expect(ROUTES).toContain('home');
    expect(ROUTES).toContain('settings.config');
    expect(ROUTES).toContain('settings.about');
  });

  test('should include admin routes in development', async () => {
    // Mock development environment
    const originalEnv = import.meta.env.DEV;
    
    // In a real test environment, we can check that admin routes exist
    const { ROUTES } = await import('../types');
    
    // These routes should exist regardless of environment in our test
    const hasAdminRoutes = ROUTES.some(route => route.startsWith('admin.'));
    expect(hasAdminRoutes).toBe(true);
  });
});

describe('Router Service Functions', () => {
  let mockWindow: any;

  beforeEach(() => {
    // Setup minimal window mock with settable location
    const locationMock = { hash: '#/' };
    mockWindow = {
      location: locationMock,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    
    // Mock location setter behavior
    Object.defineProperty(mockWindow, 'location', {
      value: locationMock,
      writable: true,
      configurable: true
    });
    
    global.window = mockWindow;
    global.location = locationMock;
  });

  test('should initialize router', async () => {
    const { initRouter } = await import('../service');
    
    initRouter();
    
    expect(mockWindow.addEventListener).toHaveBeenCalledWith(
      'hashchange', 
      expect.any(Function)
    );
  });

  test('should dispose router', async () => {
    const { initRouter, disposeRouter } = await import('../service');
    
    initRouter();
    disposeRouter();
    
    expect(mockWindow.removeEventListener).toHaveBeenCalledWith(
      'hashchange',
      expect.any(Function)
    );
  });

  test('should navigate to routes', async () => {
    const { navigate } = await import('../service');
    
    navigate('home');
    expect(mockWindow.location.hash).toBe('#/');
    
    navigate('settings.config');
    expect(mockWindow.location.hash).toBe('#/settings/config');
  });
});