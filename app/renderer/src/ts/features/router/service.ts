import { currentRoute } from './store';
import type { Route } from './types';

export function initRouter(): void {
  handleHashChange();
  window.addEventListener('hashchange', handleHashChange);
}

export function disposeRouter(): void {
  window.removeEventListener('hashchange', handleHashChange);
}

export function navigate(route: Route): void {
  const path = route === 'home' ? '#/' : `#/${route}`;
  if (location.hash !== path) {
    location.hash = path;
  } else {
    handleHashChange();
  }
}

function handleHashChange(): void {
  const hash = location.hash || '#/';
  if (hash === '#/styleguide') {
    currentRoute.set('styleguide');
  } else if (hash === '#/about') {
    currentRoute.set('about');
  } else {
    currentRoute.set('home');
  }
}


