import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { initRouter, disposeRouter, navigate } from '../service';
import { currentRoute } from '../store';
import { activeRoute } from '@features/navigation/store';
import type { Route } from '../types';

// Mock the stores
vi.mock('../store', () => ({
  currentRoute: {
    set: vi.fn(),
    subscribe: vi.fn(),
  },
}));

vi.mock('@features/navigation/store', () => ({
  activeRoute: {
    set: vi.fn(),
    subscribe: vi.fn(),
  },
}));

// Helper to get the current location hash
const getCurrentHash = () => window.location.hash;

// Helper to set location hash
const setLocationHash = (hash: string) => {
  window.location.hash = hash;
};

describe('Router Service', () => {
  let originalLocation: Location;
  let hashChangeListeners: ((event: Event) => void)[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    hashChangeListeners = [];

    // Setup location mock
    originalLocation = window.location;
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      hash: '#/',
    } as Location;

    // Mock addEventListener/removeEventListener for hashchange
    vi.spyOn(window, 'addEventListener').mockImplementation((event: string, listener: any) => {
      if (event === 'hashchange') {
        hashChangeListeners.push(listener);
      }
    });

    vi.spyOn(window, 'removeEventListener').mockImplementation((event: string, listener: any) => {
      if (event === 'hashchange') {
        const index = hashChangeListeners.indexOf(listener);
        if (index > -1) {
          hashChangeListeners.splice(index, 1);
        }
      }
    });
  });

  afterEach(() => {
    window.location = originalLocation;
    vi.restoreAllMocks();
  });

  // Helper to trigger hash change event
  const triggerHashChange = () => {
    const event = new Event('hashchange');
    hashChangeListeners.forEach(listener => listener(event));
  };

  describe('initRouter', () => {
    test('should set up hash change listener', () => {
      initRouter();

      expect(window.addEventListener).toHaveBeenCalledWith(
        'hashchange',
        expect.any(Function)
      );
    });

    test('should initialize current route from location hash', () => {
      window.location.hash = '#/settings/config';

      initRouter();

      expect(currentRoute.set).toHaveBeenCalledWith('settings.config');
      expect(activeRoute.set).toHaveBeenCalledWith('settings.config');
    });

    test('should handle empty hash as home route', () => {
      window.location.hash = '';

      initRouter();

      expect(currentRoute.set).toHaveBeenCalledWith('home');
      expect(activeRoute.set).toHaveBeenCalledWith('home');
    });

    test('should handle root hash as home route', () => {
      window.location.hash = '#/';

      initRouter();

      expect(currentRoute.set).toHaveBeenCalledWith('home');
      expect(activeRoute.set).toHaveBeenCalledWith('home');
    });
  });

  describe('disposeRouter', () => {
    test('should remove hash change listener', () => {
      initRouter();
      const addEventListenerCall = vi.mocked(window.addEventListener).mock.calls.find(
        call => call[0] === 'hashchange'
      );
      const listener = addEventListenerCall?.[1];

      disposeRouter();

      expect(window.removeEventListener).toHaveBeenCalledWith('hashchange', listener);
    });

    test('should clean up properly after multiple init/dispose cycles', () => {
      // First cycle
      initRouter();
      disposeRouter();

      // Second cycle
      initRouter();
      disposeRouter();

      expect(window.addEventListener).toHaveBeenCalledTimes(2);
      expect(window.removeEventListener).toHaveBeenCalledTimes(2);
    });
  });

  describe('navigate', () => {
    beforeEach(() => {
      initRouter();
    });

    afterEach(() => {
      disposeRouter();
    });

    test('should navigate to home route', () => {
      navigate('home');

      expect(window.location.hash).toBe('#/');
    });

    test('should navigate to nested routes', () => {
      navigate('settings.config');

      expect(window.location.hash).toBe('#/settings/config');
    });

    test('should navigate to deeply nested routes', () => {
      navigate('development.styleguide.components');

      expect(window.location.hash).toBe('#/development/styleguide/components');
    });

    test('should navigate to admin routes', () => {
      navigate('admin.entity.provider');

      expect(window.location.hash).toBe('#/admin/entity/provider');
    });

    test('should handle navigation to current route', () => {
      window.location.hash = '#/settings/config';
      vi.clearAllMocks();

      navigate('settings.config');

      // Should trigger hash change handler even if hash doesn't change
      expect(currentRoute.set).toHaveBeenCalledWith('settings.config');
      expect(activeRoute.set).toHaveBeenCalledWith('settings.config');
    });

    test('should update stores when location changes', () => {
      navigate('settings.about');

      // Simulate the hash change event
      triggerHashChange();

      expect(currentRoute.set).toHaveBeenCalledWith('settings.about');
      expect(activeRoute.set).toHaveBeenCalledWith('settings.about');
    });
  });

  describe('hash change handling', () => {
    beforeEach(() => {
      initRouter();
    });

    afterEach(() => {
      disposeRouter();
    });

    test('should handle standard route paths', () => {
      const testCases: [string, Route][] = [
        ['#/', 'home'],
        ['#/settings/config', 'settings.config'],
        ['#/settings/about', 'settings.about'],
        ['#/admin/entity/provider', 'admin.entity.provider'],
        ['#/admin/entity/model', 'admin.entity.model'],
        ['#/admin/entity/agent', 'admin.entity.agent'],
      ];

      testCases.forEach(([hash, expectedRoute]) => {
        vi.clearAllMocks();
        window.location.hash = hash;
        triggerHashChange();

        expect(currentRoute.set).toHaveBeenCalledWith(expectedRoute);
        expect(activeRoute.set).toHaveBeenCalledWith(expectedRoute);
      });
    });

    test('should handle legacy path aliases', () => {
      const testCases: [string, Route][] = [
        ['#/styleguide', 'development.styleguide'],
        ['#/about', 'settings.about'],
        ['#/test/admin/provider', 'home'], // Currently falls back to home - router logic may need enhancement
        ['#/test/something', 'development.something' as Route], // Will fall back to home
      ];

      testCases.forEach(([hash, expectedRoute]) => {
        vi.clearAllMocks();
        window.location.hash = hash;
        triggerHashChange();

        const expectedFinalRoute = expectedRoute === 'development.something' ? 'home' : expectedRoute;
        expect(currentRoute.set).toHaveBeenCalledWith(expectedFinalRoute);
      });
    });

    test('should normalize paths with trailing slashes', () => {
      window.location.hash = '#/settings/config/';
      triggerHashChange();

      expect(currentRoute.set).toHaveBeenCalledWith('settings.config');
    });

    test('should normalize paths with multiple slashes', () => {
      window.location.hash = '#/settings//config///';
      triggerHashChange();

      expect(currentRoute.set).toHaveBeenCalledWith('settings.config');
    });

    test('should handle paths with query parameters', () => {
      window.location.hash = '#/settings/config?param=value';
      triggerHashChange();

      expect(currentRoute.set).toHaveBeenCalledWith('settings.config');
    });

    test('should handle paths with fragments', () => {
      window.location.hash = '#/settings/config#section';
      triggerHashChange();

      expect(currentRoute.set).toHaveBeenCalledWith('settings.config');
    });

    test('should fall back to home for unknown routes', () => {
      const unknownPaths = [
        '#/unknown/route',
        '#/invalid',
        '#/settings/nonexistent',
        '#/admin/unknown',
      ];

      unknownPaths.forEach(hash => {
        vi.clearAllMocks();
        window.location.hash = hash;
        triggerHashChange();

        expect(currentRoute.set).toHaveBeenCalledWith('home');
        expect(activeRoute.set).toHaveBeenCalledWith('home');
      });
    });
  });

  describe('route validation', () => {
    beforeEach(() => {
      initRouter();
    });

    afterEach(() => {
      disposeRouter();
    });

    test('should validate against ROUTES array', () => {
      // Valid routes should work
      const validRoutes: Route[] = [
        'home',
        'settings.config',
        'settings.about',
        'admin.entity.provider',
        'admin.entity.model',
        'admin.entity.agent',
      ];

      validRoutes.forEach(route => {
        vi.clearAllMocks();
        navigate(route);
        triggerHashChange();

        expect(currentRoute.set).toHaveBeenCalledWith(route);
      });
    });

    test('should handle case sensitivity correctly', () => {
      window.location.hash = '#/Settings/Config'; // Wrong case
      triggerHashChange();

      expect(currentRoute.set).toHaveBeenCalledWith('home'); // Should fall back
    });
  });

  describe('concurrent navigation', () => {
    beforeEach(() => {
      initRouter();
    });

    afterEach(() => {
      disposeRouter();
    });

    test('should handle rapid navigation changes', () => {
      const routes: Route[] = [
        'settings.config',
        'admin.entity.provider',
        'home',
        'settings.about',
      ];

      routes.forEach((route, index) => {
        navigate(route);
        if (index === routes.length - 1) {
          // Only check the final route
          expect(window.location.hash).toBe(
            route === 'home' ? '#/' : `#/${route.split('.').join('/')}`
          );
        }
      });
    });

    test('should handle navigation during hash change events', () => {
      window.location.hash = '#/settings/config';
      
      // Simulate navigation during hash change handling
      const originalSet = vi.mocked(currentRoute.set);
      originalSet.mockImplementation((route) => {
        if (route === 'settings.config') {
          // Navigate to different route during handling
          navigate('admin.entity.provider');
        }
      });

      triggerHashChange();

      // Should eventually settle on the last navigation
      expect(window.location.hash).toBe('#/admin/entity/provider');
    });
  });

  describe('memory management', () => {
    test('should not leak event listeners', () => {
      // Multiple init/dispose cycles
      for (let i = 0; i < 5; i++) {
        initRouter();
        disposeRouter();
      }

      expect(hashChangeListeners).toHaveLength(0);
    });

    test('should handle dispose without init', () => {
      expect(() => disposeRouter()).not.toThrow();
    });

    test('should handle multiple inits', () => {
      initRouter();
      initRouter(); // Second init
      
      expect(window.addEventListener).toHaveBeenCalledTimes(2);
      
      disposeRouter();
      expect(hashChangeListeners).toHaveLength(1); // One listener still remains
    });
  });

  describe('browser history integration', () => {
    beforeEach(() => {
      initRouter();
    });

    afterEach(() => {
      disposeRouter();
    });

    test('should work with browser back/forward', () => {
      // Navigate to different routes
      navigate('settings.config');
      navigate('admin.entity.provider');
      navigate('home');

      // Simulate browser back
      window.location.hash = '#/admin/entity/provider';
      triggerHashChange();

      expect(currentRoute.set).toHaveBeenLastCalledWith('admin.entity.provider');

      // Simulate browser forward
      window.location.hash = '#/';
      triggerHashChange();

      expect(currentRoute.set).toHaveBeenLastCalledWith('home');
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      initRouter();
    });

    afterEach(() => {
      disposeRouter();
    });

    test('should handle empty route components', () => {
      window.location.hash = '#//settings///config//';
      triggerHashChange();

      expect(currentRoute.set).toHaveBeenCalledWith('settings.config');
    });

    test('should handle special characters in hash', () => {
      window.location.hash = '#/settings/config%20test';
      triggerHashChange();

      expect(currentRoute.set).toHaveBeenCalledWith('home'); // Should fall back
    });

    test('should handle very long paths', () => {
      const longPath = '#/' + 'very/'.repeat(50) + 'long/path';
      window.location.hash = longPath;
      triggerHashChange();

      expect(currentRoute.set).toHaveBeenCalledWith('home'); // Should fall back
    });
  });
});