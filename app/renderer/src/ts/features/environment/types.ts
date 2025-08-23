// Environment feature types
export type EnvironmentType = 'electron' | 'browser' | 'unknown';

export interface EnvironmentInfo {
  type: EnvironmentType;
  isElectron: boolean;
  isBrowser: boolean;
  hasIPC: boolean;
  hasRestAPI: boolean;
}