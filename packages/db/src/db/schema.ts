import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const test = sqliteTable('test', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  column1: text('column1'),
  column2: text('column2'),
});

// AI Management Tables
export const aiProviders = sqliteTable('ai_providers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  authentication: text('authentication').notNull(), // 'bearer', 'x-api-key', 'credentials', 'no'
  secretKey: text('secret_key'), // API key/secret for authentication
  configuration: text('configuration').notNull().default('{}'), // JSON configuration
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const aiModels = sqliteTable('ai_models', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  model: text('model').notNull(), // Model identifier for API calls
  inputPrice: real('input_price'), // Price per token/request
  outputPrice: real('output_price'), // Price per token/response
  endpoint: text('endpoint').notNull(),
  params: text('params').notNull().default('{}'), // JSON parameters for API calls
  messageLocation: text('message_location'), // Path to message content in response
  messageStreamLocation: text('message_stream_location'), // Path for streaming responses
  inputTokenCountLocation: text('input_token_count_location'), // Path to input token count
  outputTokenCountLocation: text('output_token_count_location'), // Path to output token count
  providerId: integer('provider_id').notNull().references(() => aiProviders.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const aiAgents = sqliteTable('ai_agents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  version: text('version').notNull().default('1.0'),
  enable: integer('enable', { mode: 'boolean' }).notNull().default(true),
  isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false),
  systemPrompt: text('system_prompt'),
  configuration: text('configuration').notNull().default('{}'), // JSON configuration
  modelId: integer('model_id').notNull().references(() => aiModels.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Discussion Management Tables
export const discussions = sqliteTable('discussions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull().default('New Discussion'),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
  agentId: integer('agent_id').notNull().references(() => aiAgents.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  who: text('who').notNull(), // 'user' or 'agent'
  content: text('content').notNull(),
  discussionId: integer('discussion_id').notNull().references(() => discussions.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Configuration Management Table
export const configurations = sqliteTable('configurations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  value: text('value').notNull(),
  defaultValue: text('default_value').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
