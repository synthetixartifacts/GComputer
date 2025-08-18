import type {
  Provider,
  Model,
  Agent,
  ProviderFilters,
  ModelFilters,
  AgentFilters,
  ProviderInsert,
  ModelInsert,
  AgentInsert,
  ProviderUpdate,
  ModelUpdate,
  AgentUpdate,
} from './types';
import { isElectronEnvironment } from '../environment';

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

// Utility functions (same for both environments)
export function parseJsonConfiguration(configStr: string): Record<string, any> {
  try {
    return JSON.parse(configStr || '{}');
  } catch {
    return {};
  }
}

export function stringifyConfiguration(config: Record<string, any>): string {
  try {
    return JSON.stringify(config, null, 2);
  } catch {
    return '{}';
  }
}