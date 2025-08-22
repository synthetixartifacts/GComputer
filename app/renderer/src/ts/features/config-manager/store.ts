/**
 * Config Manager Store
 * Svelte store for configuration management state
 */

import { writable, get } from 'svelte/store';
import type { ConfigManagerState } from './types';

const initialState: ConfigManagerState = {
  publicConfig: null,
  envCache: new Map(),
  providerSecrets: new Map(),
  loading: false,
  error: null,
};

export const configManagerStore = writable<ConfigManagerState>(initialState);

// Export get function for synchronous access
export { get };