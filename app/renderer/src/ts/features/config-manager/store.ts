/**
 * Config Manager Store
 * Svelte store for configuration management state
 */

import { writable } from 'svelte/store';
import type { ConfigManagerState } from './types';

const initialState: ConfigManagerState = {
  publicConfig: null,
  envCache: new Map(),
  providerSecrets: new Map(),
  loading: false,
  error: null,
};

export const configManagerStore = writable<ConfigManagerState>(initialState);