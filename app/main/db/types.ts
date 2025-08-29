// Database type definitions for all entities

// Test table types
export interface TestFilters {
  column1?: string;
  column2?: string;
}

export interface TestInsert {
  column1: string | null;
  column2: string | null;
}

export interface TestUpdate {
  id: number;
  column1?: string | null;
  column2?: string | null;
}

// AI Provider types
export interface ProviderFilters {
  code?: string;
  name?: string;
  url?: string;
}

export interface ProviderInsert {
  code: string;
  name: string;
  url: string;
  authentication: string;
  secretKey?: string;
  configuration?: string;
}

export interface ProviderUpdate {
  id: number;
  code?: string;
  name?: string;
  url?: string;
  authentication?: string;
  secretKey?: string;
  configuration?: string;
}

// AI Model types
export interface ModelFilters {
  code?: string;
  name?: string;
  model?: string;
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
  messageStreamLocation?: string;
  inputTokenCountLocation?: string;
  outputTokenCountLocation?: string;
  providerId: number;
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
  messageStreamLocation?: string;
  inputTokenCountLocation?: string;
  outputTokenCountLocation?: string;
  providerId?: number;
}

// AI Agent types
export interface AgentFilters {
  code?: string;
  name?: string;
  version?: string;
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

// Configuration types
export interface ConfigurationFilters {
  code?: string;
  name?: string;
  category?: string;
  type?: string;
}

export interface ConfigurationInsert {
  code: string;
  name: string;
  type: string;
  value: string;
  defaultValue: string;
  options?: string;
  description?: string;
  category?: string;
  isSystem?: boolean;
  isSecret?: boolean;
  validation?: string;
}

export interface ConfigurationUpdate {
  id: number;
  code?: string;
  name?: string;
  type?: string;
  value?: string;
  defaultValue?: string;
  options?: string;
  description?: string;
  category?: string;
  isSystem?: boolean;
  isSecret?: boolean;
  validation?: string;
}

// Generic database operation result
export interface DbResult {
  ok: true;
}