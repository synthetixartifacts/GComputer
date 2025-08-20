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

export function navigate(route: Route): void {
  const path = route === 'home' ? '#/' : `#/${(route as string).split('.').join('/')}`;
  if (location.hash !== path) {
    location.hash = path;
  } else {
    handleHashChange();
  }
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


