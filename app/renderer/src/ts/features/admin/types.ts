// Admin entity types
export interface Provider {
  id: number;
  code: string;
  name: string;
  url: string;
  authentication: string;
  configuration: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Model {
  id: number;
  code: string;
  name: string;
  model: string;
  inputPrice?: number;
  outputPrice?: number;
  endpoint: string;
  params: string;
  messageLocation?: string;
  streamMessageLocation?: string;
  inputTokenCountLocation?: string;
  outputTokenCountLocation?: string;
  providerId: number;
  createdAt: Date;
  updatedAt: Date;
  provider?: {
    id: number;
    name: string;
    code: string;
  };
}

export interface Agent {
  id: number;
  code: string;
  name: string;
  description: string;
  version: string;
  enable: boolean;
  isSystem: boolean;
  systemPrompt?: string;
  configuration: string;
  modelId: number;
  createdAt: Date;
  updatedAt: Date;
  model?: {
    id: number;
    name: string;
    code: string;
  };
  provider?: {
    id: number;
    name: string;
    code: string;
  };
}

// Filter types
export interface ProviderFilters {
  code?: string;
  name?: string;
  url?: string;
}

export interface ModelFilters {
  code?: string;
  name?: string;
  model?: string;
}

export interface AgentFilters {
  code?: string;
  name?: string;
  version?: string;
}

// Insert types
export interface ProviderInsert {
  code: string;
  name: string;
  url: string;
  authentication: string;
  configuration?: string;
}

export interface ModelInsert {
  code: string;
  name: string;
  model: string;
  inputPrice?: number;
  outputPrice?: number;
  endpoint: string;
  params?: string;
  messageLocation?: string;
  streamMessageLocation?: string;
  inputTokenCountLocation?: string;
  outputTokenCountLocation?: string;
  providerId: number;
}

export interface AgentInsert {
  code: string;
  name: string;
  description?: string;
  version?: string;
  enable?: boolean;
  isSystem?: boolean;
  systemPrompt?: string;
  configuration?: string;
  modelId: number;
}

// Update types
export interface ProviderUpdate {
  id: number;
  code?: string;
  name?: string;
  url?: string;
  authentication?: string;
  configuration?: string;
}

export interface ModelUpdate {
  id: number;
  code?: string;
  name?: string;
  model?: string;
  inputPrice?: number;
  outputPrice?: number;
  endpoint?: string;
  params?: string;
  messageLocation?: string;
  streamMessageLocation?: string;
  inputTokenCountLocation?: string;
  outputTokenCountLocation?: string;
  providerId?: number;
}

export interface AgentUpdate {
  id: number;
  code?: string;
  name?: string;
  description?: string;
  version?: string;
  enable?: boolean;
  isSystem?: boolean;
  systemPrompt?: string;
  configuration?: string;
  modelId?: number;
}

// Admin entity type union
export type AdminEntity = 'providers' | 'models' | 'agents';

// Table configuration for each entity
export interface AdminTableConfig<T> {
  columns: Array<{
    id: keyof T & string;
    title: string;
    editable?: boolean;
    width?: string;
    access?: (row: T) => string | number | null | undefined;
  }>;
  entityName: string;
  singularName: string;
}

// Authentication options for providers
export const AUTHENTICATION_OPTIONS = [
  { label: 'Bearer Token', value: 'bearer' },
  { label: 'X-API-Key', value: 'x-api-key' },
  { label: 'Credentials', value: 'credentials' },
  { label: 'No Authentication', value: 'no' },
] as const;