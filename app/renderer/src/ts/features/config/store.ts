import { writable, derived } from 'svelte/store';
import type { AppConfig, ConfigMode } from './types';
import { BASE_ROUTES, DEV_ROUTES, ADMIN_ROUTES } from './types';
import type { Route } from '@features/router/types';

export const configMode = writable<ConfigMode>('production');

export const appConfig = derived(configMode, ($mode): AppConfig => {
  return {
    mode: $mode,
    features: {
      development: $mode === 'dev' || $mode === 'beta',
      admin: $mode === 'dev' || $mode === 'beta',
      beta: $mode === 'beta',
    },
  };
});

export const availableRoutes = derived(appConfig, ($config): Route[] => {
  const routes: Route[] = [...BASE_ROUTES] as Route[];
  
  if ($config.features.development) {
    routes.push(...(DEV_ROUTES as unknown as Route[]));
  }
  
  if ($config.features.admin) {
    routes.push(...(ADMIN_ROUTES as unknown as Route[]));
  }
  
  return routes;
});

export const isRouteAvailable = derived(availableRoutes, ($routes) => {
  return (route: Route): boolean => {
    return $routes.includes(route);
  };
});