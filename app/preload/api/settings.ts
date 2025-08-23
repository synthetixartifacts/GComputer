/**
 * Settings API for preload
 */

import { createInvokeWrapper, createSubscription } from '../ipc-wrapper';
import type { AppSettings } from '../types';

export const settingsApi = {
  all: createInvokeWrapper<[], AppSettings>('settings:all'),
  get: createInvokeWrapper<[keyof AppSettings], AppSettings[keyof AppSettings]>('settings:get'),
  set: createInvokeWrapper<[keyof AppSettings, any], AppSettings>('settings:set'),
  getEnvMode: createInvokeWrapper<[], string>('settings:getEnvMode'),
  subscribe: createSubscription<AppSettings>('settings:changed'),
};