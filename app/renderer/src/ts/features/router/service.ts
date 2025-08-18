import { currentRoute } from './store';
import type { Route } from './types';
import { ROUTES } from './types';
import { activeRoute } from '@features/navigation/store';

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
  // Guard against unknown routes
  return (ROUTES as readonly string[]).includes(dotted) ? dotted : 'home';
}

function handleHashChange(): void {
  const hash = location.hash || '#/';
  const route = normalizeHashToRoute(hash);
  currentRoute.set(route);
  activeRoute.set(route);
}


