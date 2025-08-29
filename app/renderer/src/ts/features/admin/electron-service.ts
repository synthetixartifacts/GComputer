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

/**
 * Electron-specific admin service using IPC
 * Original service logic extracted for environment-specific use
 */

// API type definitions
type ProviderApi = {
  list: (filters?: ProviderFilters) => Promise<Provider[]>;
  insert: (payload: ProviderInsert) => Promise<Provider | null>;
  update: (payload: ProviderUpdate) => Promise<Provider | null>;
  delete: (id: number) => Promise<{ ok: true }>;
};

type ModelApi = {
  list: (filters?: ModelFilters) => Promise<Model[]>;
  insert: (payload: ModelInsert) => Promise<Model | null>;
  update: (payload: ModelUpdate) => Promise<Model | null>;
  delete: (id: number) => Promise<{ ok: true }>;
};

type AgentApi = {
  list: (filters?: AgentFilters) => Promise<Agent[]>;
  insert: (payload: AgentInsert) => Promise<Agent | null>;
  update: (payload: AgentUpdate) => Promise<Agent | null>;
  delete: (id: number) => Promise<{ ok: true }>;
};

type ConfigurationApi = {
  list: (filters?: ConfigurationFilters) => Promise<Configuration[]>;
  insert: (payload: ConfigurationInsert) => Promise<Configuration | null>;
  update: (payload: ConfigurationUpdate) => Promise<Configuration | null>;
  delete: (id: number) => Promise<{ ok: true }>;
  getByCode: (code: string) => Promise<Configuration | null>;
  updateByCode: (code: string, value: string) => Promise<Configuration | null>;
  getAllAsMap: () => Promise<Record<string, string>>;
};

// Fallback API implementations
function createFallbackProviderApi(): ProviderApi {
  return {
    async list() { return []; },
    async insert() { return null; },
    async update() { return null; },
    async delete() { return { ok: true } as const; },
  };
}

function createFallbackModelApi(): ModelApi {
  return {
    async list() { return []; },
    async insert() { return null; },
    async update() { return null; },
    async delete() { return { ok: true } as const; },
  };
}

function createFallbackAgentApi(): AgentApi {
  return {
    async list() { return []; },
    async insert() { return null; },
    async update() { return null; },
    async delete() { return { ok: true } as const; },
  };
}

function createFallbackConfigurationApi(): ConfigurationApi {
  return {
    async list() { return []; },
    async insert() { return null; },
    async update() { return null; },
    async delete() { return { ok: true } as const; },
    async getByCode() { return null; },
    async updateByCode() { return null; },
    async getAllAsMap() { return {}; },
  };
}

// API access functions
function providerApi(): ProviderApi {
  const impl: unknown = (window as any).gc?.db?.admin?.providers;
  return (impl as ProviderApi) ?? createFallbackProviderApi();
}

function modelApi(): ModelApi {
  const impl: unknown = (window as any).gc?.db?.admin?.models;
  return (impl as ModelApi) ?? createFallbackModelApi();
}

function agentApi(): AgentApi {
  const impl: unknown = (window as any).gc?.db?.admin?.agents;
  return (impl as AgentApi) ?? createFallbackAgentApi();
}

function configurationApi(): ConfigurationApi {
  const impl: unknown = (window as any).gc?.db?.admin?.configurations;
  return (impl as ConfigurationApi) ?? createFallbackConfigurationApi();
}

// Provider operations
export async function listProviders(filters?: ProviderFilters): Promise<Provider[]> {
  return await providerApi().list(filters);
}

export async function createProvider(data: ProviderInsert): Promise<Provider | null> {
  return await providerApi().insert(data);
}

export async function updateProvider(data: ProviderUpdate): Promise<Provider | null> {
  return await providerApi().update(data);
}

export async function deleteProvider(id: number): Promise<{ ok: true }> {
  return await providerApi().delete(id);
}

// Model operations
export async function listModels(filters?: ModelFilters): Promise<Model[]> {
  return await modelApi().list(filters);
}

export async function createModel(data: ModelInsert): Promise<Model | null> {
  return await modelApi().insert(data);
}

export async function updateModel(data: ModelUpdate): Promise<Model | null> {
  return await modelApi().update(data);
}

export async function deleteModel(id: number): Promise<{ ok: true }> {
  return await modelApi().delete(id);
}

// Agent operations
export async function listAgents(filters?: AgentFilters): Promise<Agent[]> {
  return await agentApi().list(filters);
}

export async function createAgent(data: AgentInsert): Promise<Agent | null> {
  return await agentApi().insert(data);
}

export async function updateAgent(data: AgentUpdate): Promise<Agent | null> {
  return await agentApi().update(data);
}

export async function deleteAgent(id: number): Promise<{ ok: true }> {
  return await agentApi().delete(id);
}

// Configuration operations
export async function listConfigurations(filters?: ConfigurationFilters): Promise<Configuration[]> {
  return await configurationApi().list(filters);
}

export async function createConfiguration(data: ConfigurationInsert): Promise<Configuration | null> {
  return await configurationApi().insert(data);
}

export async function updateConfiguration(data: ConfigurationUpdate): Promise<Configuration | null> {
  return await configurationApi().update(data);
}

export async function deleteConfiguration(id: number): Promise<{ ok: true }> {
  return await configurationApi().delete(id);
}

export async function getConfigurationByCode(code: string): Promise<Configuration | null> {
  return await configurationApi().getByCode(code);
}

export async function updateConfigurationByCode(code: string, value: string): Promise<Configuration | null> {
  return await configurationApi().updateByCode(code, value);
}

export async function getAllConfigurationsAsMap(): Promise<Record<string, string>> {
  return await configurationApi().getAllAsMap();
}