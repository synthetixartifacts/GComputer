/**
 * Configuration API for preload
 */

import { createInvokeWrapper, validatePath } from '../ipc-wrapper';

export const configApi = {
  getPublic: createInvokeWrapper<[], Record<string, unknown>>('config:getPublic'),
  
  getEnv: createInvokeWrapper<[string, string?], string | undefined>('config:getEnv'),
  
  hasProviderSecret(providerCode: string): Promise<boolean> {
    validatePath(providerCode); // Reuse path validation for non-empty string
    return createInvokeWrapper<[string], boolean>('config:hasSecret')(providerCode);
  },
  
  getProviderSecret(providerCode: string): Promise<string | undefined> {
    validatePath(providerCode); // Reuse path validation for non-empty string
    return createInvokeWrapper<[string], string | undefined>('config:getSecret')(providerCode);
  },
};