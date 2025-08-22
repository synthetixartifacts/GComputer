import { get } from 'svelte/store';
import { currentRoute } from './store';
import type { Route } from './types';
import { ALL_ROUTES } from './types';
import { activeRoute } from '@features/navigation/store';
import { availableRoutes } from '@features/config/store';

export function initRouter(): void {
  handleHashChange();
  window.addEventListener('hashchange', handleHashChange);
}

export function disposeRouter(): void {
  window.removeEventListener('hashchange', handleHashChange);
}

export function navigate(route: Route, params?: Record<string, any>): void {
  let path = route === 'home' ? '#/' : `#/${(route as string).split('.').join('/')}`;
  
  // Add query params if provided
  if (params && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    path += `?${queryString}`;
  }
  
  if (location.hash !== path) {
    location.hash = path;
  } else {
    handleHashChange();
  }
}

// Alias for navigate with better naming
export function goto(route: Route, params?: Record<string, any>): void {
  navigate(route, params);
}

// Get route parameters from current URL
export function getRouteParams(): Record<string, string> {
  const hash = location.hash || '';
  const queryIndex = hash.indexOf('?');
  
  if (queryIndex === -1) {
    return {};
  }
  
  const queryString = hash.slice(queryIndex + 1);
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
}

function normalizeHashToRoute(hash: string): Route {
  // Strip "#/", query/hash fragments, and trailing slashes
  const raw = hash
    .replace(/^#\//, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '');
  if (raw === '') {
    return 'home';
  }
  // Backward-compat aliases for legacy paths
  const withAlias =
    raw === 'styleguide'
      ? 'development/styleguide'
      : raw === 'about'
        ? 'settings/about'
        : raw.startsWith('test/')
          ? raw.replace(/^test\/admin\//, 'admin/').replace(/^test\//, 'development/')
          : raw;
  // Convert "a/b/c" → "a.b.c", removing any accidental duplicate slashes
  const dotted = withAlias
    .split('/')
    .filter(Boolean)
    .join('.') as Route;
  
  // First check if it's a valid route at all
  if (!(ALL_ROUTES as readonly string[]).includes(dotted)) {
    return 'home';
  }
  
  // Then check if it's available based on runtime configuration
  const available = get(availableRoutes);
  return available.includes(dotted) ? dotted : 'home';
}

function handleHashChange(): void {
  const hash = location.hash || '#/';
  const route = normalizeHashToRoute(hash);
  currentRoute.set(route);
  activeRoute.set(route);
}


