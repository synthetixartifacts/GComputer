// Admin entity types
export interface Provider {
  id: number;
  code: string;
  name: string;
  url: string;
  authentication: string;
  secretKey?: string;
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
  messageStreamLocation?: string;
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

export interface Configuration {
  id: number;
  code: string;
  name: string;
  type: string;
  value: string;
  defaultValue: string;
  options?: string;
  description?: string;
  category: string;
  isSystem: boolean;
  isSecret: boolean;
  validation?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Filter types
export interface ProviderFilters {
  code?: string;
  name?: string;
  url?: string;
  [key: string]: string | undefined;
}

export interface ModelFilters {
  code?: string;
  name?: string;
  model?: string;
  providerId?: number;
  [key: string]: string | number | undefined;
}

export interface AgentFilters {
  code?: string;
  name?: string;
  version?: string;
  modelId?: number;
  [key: string]: string | number | undefined;
}

export interface ConfigurationFilters {
  code?: string;
  name?: string;
  category?: string;
  type?: string;
  [key: string]: string | undefined;
}

// Insert types
export interface ProviderInsert {
  code: string;
  name: string;
  url: string;
  authentication: string;
  secretKey?: string;
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
  messageStreamLocation?: string;
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

// Update types
export interface ProviderUpdate {
  id: number;
  code?: string;
  name?: string;
  url?: string;
  authentication?: string;
  secretKey?: string;
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
  messageStreamLocation?: string;
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

// Admin entity type union
export type AdminEntity = 'providers' | 'models' | 'agents' | 'configurations';

// Field types for forms
export type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'email' | 'url' | 'relationship';

// Field validation rules
export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
}

// Select field option
export interface SelectOption {
  label: string;
  value: string | number;
}

// Relationship field configuration
export interface RelationshipConfig {
  entityKey: string;      // Key in the data object (e.g., 'provider' for data.provider)
  valueField: string;     // Field to use as value (e.g., 'id' for provider.id)
  labelField: string;     // Field to display in options (e.g., 'name' for provider.name)
}

// Unified field configuration for both table display and form editing
export interface AdminFieldConfig<T> {
  id: string; // Changed from keyof T & string to just string for flexibility
  title: string;
  type?: FieldType;
  width?: string;
  
  // Display configuration
  showInTable?: boolean;
  access?: (row: T) => string | number | null | undefined;
  
  // Form configuration
  showInForm?: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: FieldValidation;
  options?: SelectOption[];
  
  // Relationship configuration (for type: 'relationship')
  relationship?: RelationshipConfig;
  
  // Special configurations
  readonly?: boolean;
  defaultValue?: string | number | boolean | null;
}

// Updated table configuration
export interface AdminTableConfig<T> {
  fields: AdminFieldConfig<T>[];
  entityType: string;
}

// Form modes
export type FormMode = 'create' | 'edit' | 'view' | 'duplicate';

// Form configuration
export interface AdminFormConfig<T> {
  fields: AdminFieldConfig<T>[];
  mode: FormMode;
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