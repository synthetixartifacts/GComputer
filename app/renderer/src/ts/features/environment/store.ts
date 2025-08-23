import { writable, derived } from 'svelte/store';
import type { EnvironmentInfo } from './types';
import { getEnvironmentInfo } from './service';

// Initialize environment info on load
const initialInfo = getEnvironmentInfo();

export const environmentInfo = writable<EnvironmentInfo>(initialInfo);

export const isElectron = derived(
  environmentInfo,
  $info => $info.isElectron
);

export const isBrowser = derived(
  environmentInfo,
  $info => $info.isBrowser
);

export const environmentType = derived(
  environmentInfo,
  $info => $info.type
);