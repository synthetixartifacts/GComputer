/**
 * IPC Wrapper Utility
 * Provides a DRY approach to creating IPC method wrappers
 */

import { ipcRenderer, type IpcRendererEvent } from 'electron';

/**
 * Creates a simple IPC invoke wrapper
 */
export function createInvokeWrapper<TArgs extends any[], TResult>(
  channel: string
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => ipcRenderer.invoke(channel, ...args);
}

/**
 * Creates an IPC invoke wrapper with validation
 */
export function createValidatedInvokeWrapper<TArgs extends any[], TResult>(
  channel: string,
  validator?: (args: TArgs) => void
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => {
    if (validator) {
      validator(args);
    }
    return ipcRenderer.invoke(channel, ...args);
  };
}

/**
 * Creates a subscription handler
 */
export function createSubscription<TPayload>(
  channel: string
): (callback: (payload: TPayload) => void) => () => void {
  return (callback: (payload: TPayload) => void) => {
    const listener = (_event: IpcRendererEvent, payload: TPayload) => callback(payload);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  };
}

/**
 * Creates a send wrapper (fire and forget)
 */
export function createSendWrapper<TArgs extends any[]>(
  channel: string
): (...args: TArgs) => void {
  return (...args: TArgs) => ipcRenderer.send(channel, ...args);
}

/**
 * Validates that a value is a positive integer
 */
export function validatePositiveInteger(value: unknown, name: string): void {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
}

/**
 * Validates that a path is a string and not empty
 */
export function validatePath(path: unknown): void {
  if (typeof path !== 'string' || path.trim().length === 0) {
    throw new Error('Path must be a non-empty string');
  }
}

/**
 * Validates that a value is a valid enum value
 */
export function validateEnum<T extends string>(
  value: unknown,
  validValues: readonly T[],
  name: string
): void {
  if (!validValues.includes(value as T)) {
    throw new Error(`${name} must be one of: ${validValues.join(', ')}`);
  }
}