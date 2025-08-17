import { writable, derived } from 'svelte/store';
import type {
  Provider,
  Model,
  Agent,
  ProviderFilters,
  ModelFilters,
  AgentFilters,
  AdminEntity,
} from './types';

// Entity stores
export const providers = writable<Provider[]>([]);
export const models = writable<Model[]>([]);
export const agents = writable<Agent[]>([]);

// Filter stores
export const providerFilters = writable<ProviderFilters>({});
export const modelFilters = writable<ModelFilters>({});
export const agentFilters = writable<AgentFilters>({});

// UI state stores
export const editingRows = writable<Record<AdminEntity, Set<number>>>({
  providers: new Set(),
  models: new Set(),
  agents: new Set(),
});

export const loadingState = writable<Record<AdminEntity, boolean>>({
  providers: false,
  models: false,
  agents: false,
});

export const selectedEntity = writable<AdminEntity>('providers');

// Derived stores for filtered data
export const filteredProviders = derived(
  [providers, providerFilters],
  ([providersList, filters]) => {
    return providersList.filter((provider) => {
      const matchesCode = !filters.code || provider.code.toLowerCase().includes(filters.code.toLowerCase());
      const matchesName = !filters.name || provider.name.toLowerCase().includes(filters.name.toLowerCase());
      const matchesUrl = !filters.url || provider.url.toLowerCase().includes(filters.url.toLowerCase());
      return matchesCode && matchesName && matchesUrl;
    });
  }
);

export const filteredModels = derived(
  [models, modelFilters],
  ([modelsList, filters]) => {
    return modelsList.filter((model) => {
      const matchesCode = !filters.code || model.code.toLowerCase().includes(filters.code.toLowerCase());
      const matchesName = !filters.name || model.name.toLowerCase().includes(filters.name.toLowerCase());
      const matchesModel = !filters.model || model.model.toLowerCase().includes(filters.model.toLowerCase());
      return matchesCode && matchesName && matchesModel;
    });
  }
);

export const filteredAgents = derived(
  [agents, agentFilters],
  ([agentsList, filters]) => {
    return agentsList.filter((agent) => {
      const matchesCode = !filters.code || agent.code.toLowerCase().includes(filters.code.toLowerCase());
      const matchesName = !filters.name || agent.name.toLowerCase().includes(filters.name.toLowerCase());
      const matchesVersion = !filters.version || agent.version.toLowerCase().includes(filters.version.toLowerCase());
      return matchesCode && matchesName && matchesVersion;
    });
  }
);

// Helper functions
export function toggleEditRow(entity: AdminEntity, id: number): void {
  editingRows.update((current) => {
    const newSet = new Set(current[entity]);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    return { ...current, [entity]: newSet };
  });
}

export function setEditingRow(entity: AdminEntity, id: number, editing: boolean): void {
  editingRows.update((current) => {
    const newSet = new Set(current[entity]);
    if (editing) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    return { ...current, [entity]: newSet };
  });
}

export function clearAllFilters(entity: AdminEntity): void {
  switch (entity) {
    case 'providers':
      providerFilters.set({});
      break;
    case 'models':
      modelFilters.set({});
      break;
    case 'agents':
      agentFilters.set({});
      break;
  }
}

export function setLoading(entity: AdminEntity, loading: boolean): void {
  loadingState.update((current) => ({ ...current, [entity]: loading }));
}