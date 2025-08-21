/**
 * Config Manager Types
 * Type definitions for configuration management in renderer
 */

export interface PublicConfig {
  mode: string;
  [key: string]: any;
}

export interface ConfigManagerState {
  publicConfig: PublicConfig | null;
  envCache: Map<string, string | undefined>;
  providerSecrets: Map<string, boolean>;
  loading: boolean;
  error: string | null;
}