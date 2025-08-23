/**
 * Environment detection service
 * Determines if running in Electron or browser environment
 */
import type { EnvironmentType, EnvironmentInfo } from './types';

export function isElectronEnvironment(): boolean {
  return typeof window !== 'undefined' && 
         typeof (window as any).gc !== 'undefined' &&
         typeof (window as any).gc.db !== 'undefined';
}

export function isBrowserEnvironment(): boolean {
  return !isElectronEnvironment() && typeof window !== 'undefined';
}

export function getEnvironmentType(): EnvironmentType {
  if (isElectronEnvironment()) return 'electron';
  if (isBrowserEnvironment()) return 'browser';
  return 'unknown';
}

export function getEnvironmentInfo(): EnvironmentInfo {
  const isElectron = isElectronEnvironment();
  const isBrowser = isBrowserEnvironment();
  
  return {
    type: getEnvironmentType(),
    isElectron,
    isBrowser,
    hasIPC: isElectron,
    hasRestAPI: isBrowser,
  };
}

export function logEnvironmentInfo(): void {
  const env = getEnvironmentType();
  console.log(`[Environment] Running in: ${env}`);
  
  if (env === 'electron') {
    console.log('[Environment] Using IPC services');
  } else if (env === 'browser') {
    console.log('[Environment] Using REST API services');
  }
}