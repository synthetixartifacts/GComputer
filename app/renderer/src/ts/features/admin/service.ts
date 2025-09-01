import type {
  Provider,
  Model,
  Agent,
  Configuration,
  ProviderFilters,
  ModelFilters,
  AgentFilters,
  ConfigurationFilters,
  ProviderInsert,
  ModelInsert,
  AgentInsert,
  ConfigurationInsert,
  ProviderUpdate,
  ModelUpdate,
  AgentUpdate,
  ConfigurationUpdate,
} from './types';
import { isElectronEnvironment } from '../environment/service';
import { parseConfiguration, stringifyConfiguration } from '@ts/shared/utils/json-config';

// Import services directly to avoid dynamic import issues
import * as electronService from './electron-service';
import * as browserService from './browser-service';

// Provider operations
export async function listProviders(filters?: ProviderFilters): Promise<Provider[]> {
  if (isElectronEnvironment()) {
    return electronService.listProviders(filters);
  } else {
    return browserService.listProviders(filters);
  }
}

export async function createProvider(data: ProviderInsert): Promise<Provider | null> {
  if (isElectronEnvironment()) {
    return electronService.createProvider(data);
  } else {
    return browserService.createProvider(data);
  }
}

export async function updateProvider(data: ProviderUpdate): Promise<Provider | null> {
  if (isElectronEnvironment()) {
    return electronService.updateProvider(data);
  } else {
    return browserService.updateProvider(data);
  }
}

export async function deleteProvider(id: number): Promise<{ ok: true }> {
  if (isElectronEnvironment()) {
    return electronService.deleteProvider(id);
  } else {
    return browserService.deleteProvider(id);
  }
}

// Model operations
export async function listModels(filters?: ModelFilters): Promise<Model[]> {
  if (isElectronEnvironment()) {
    return electronService.listModels(filters);
  } else {
    return browserService.listModels(filters);
  }
}

export async function createModel(data: ModelInsert): Promise<Model | null> {
  if (isElectronEnvironment()) {
    return electronService.createModel(data);
  } else {
    return browserService.createModel(data);
  }
}

export async function updateModel(data: ModelUpdate): Promise<Model | null> {
  if (isElectronEnvironment()) {
    return electronService.updateModel(data);
  } else {
    return browserService.updateModel(data);
  }
}

export async function deleteModel(id: number): Promise<{ ok: true }> {
  if (isElectronEnvironment()) {
    return electronService.deleteModel(id);
  } else {
    return browserService.deleteModel(id);
  }
}

// Agent operations
export async function listAgents(filters?: AgentFilters): Promise<Agent[]> {
  if (isElectronEnvironment()) {
    return electronService.listAgents(filters);
  } else {
    return browserService.listAgents(filters);
  }
}

export async function createAgent(data: AgentInsert): Promise<Agent | null> {
  if (isElectronEnvironment()) {
    return electronService.createAgent(data);
  } else {
    return browserService.createAgent(data);
  }
}

export async function updateAgent(data: AgentUpdate): Promise<Agent | null> {
  if (isElectronEnvironment()) {
    return electronService.updateAgent(data);
  } else {
    return browserService.updateAgent(data);
  }
}

export async function deleteAgent(id: number): Promise<{ ok: true }> {
  if (isElectronEnvironment()) {
    return electronService.deleteAgent(id);
  } else {
    return browserService.deleteAgent(id);
  }
}

// Configuration operations
export async function listConfigurations(filters?: ConfigurationFilters): Promise<Configuration[]> {
  if (isElectronEnvironment()) {
    return electronService.listConfigurations(filters);
  } else {
    return browserService.listConfigurations(filters);
  }
}

export async function createConfiguration(data: ConfigurationInsert): Promise<Configuration | null> {
  if (isElectronEnvironment()) {
    return electronService.createConfiguration(data);
  } else {
    return browserService.createConfiguration(data);
  }
}

export async function updateConfiguration(data: ConfigurationUpdate): Promise<Configuration | null> {
  if (isElectronEnvironment()) {
    return electronService.updateConfiguration(data);
  } else {
    return browserService.updateConfiguration(data);
  }
}

export async function deleteConfiguration(id: number): Promise<{ ok: true }> {
  if (isElectronEnvironment()) {
    return electronService.deleteConfiguration(id);
  } else {
    return browserService.deleteConfiguration(id);
  }
}

export async function getConfigurationByCode(code: string): Promise<Configuration | null> {
  if (isElectronEnvironment()) {
    return electronService.getConfigurationByCode(code);
  } else {
    return browserService.getConfigurationByCode(code);
  }
}

export async function updateConfigurationByCode(code: string, value: string): Promise<Configuration | null> {
  if (isElectronEnvironment()) {
    return electronService.updateConfigurationByCode(code, value);
  } else {
    return browserService.updateConfigurationByCode(code, value);
  }
}

export async function getAllConfigurationsAsMap(): Promise<Record<string, string>> {
  if (isElectronEnvironment()) {
    return electronService.getAllConfigurationsAsMap();
  } else {
    return browserService.getAllConfigurationsAsMap();
  }
}

// Utility functions (same for both environments)
export function parseJsonConfiguration(configStr: string): Record<string, any> {
  return parseConfiguration(configStr);
}

export { stringifyConfiguration };

// Create admin service object for backward compatibility
export const adminService = {
  // Providers
  getProviders: listProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  
  // Models
  getModels: listModels,
  createModel,
  updateModel,
  deleteModel,
  
  // Agents
  getAgents: listAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  
  // Configurations
  getConfigurations: listConfigurations,
  createConfiguration,
  updateConfiguration,
  deleteConfiguration,
  getConfigurationByCode,
  updateConfigurationByCode,
  getAllConfigurationsAsMap,
  
  // Utilities
  parseJsonConfiguration,
  stringifyConfiguration
};