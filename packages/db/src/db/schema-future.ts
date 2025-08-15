import { sqliteTable, integer, text, real, blob, index } from 'drizzle-orm/sqlite-core';

// Core file system indexing
export const files = sqliteTable('files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  path: text('path').notNull().unique(),
  dir: text('dir').notNull(),
  name: text('name').notNull(),
  ext: text('ext'),
  sizeBytes: integer('size_bytes').notNull(),
  mtime: integer('mtime').notNull(), // Unix timestamp
  ctime: integer('ctime').notNull(), // Creation time
  hash: text('hash'), // Content hash for deduplication
  mimeType: text('mime_type'),
  kind: text('kind').notNull(), // 'document', 'image', 'video', 'audio', 'code', etc.
  status: text('status').notNull().default('active'), // 'active', 'deleted', 'moved'
  indexed: integer('indexed', { mode: 'timestamp' }), // When last indexed
}, (table) => ({
  pathIdx: index('files_path_idx').on(table.path),
  dirIdx: index('files_dir_idx').on(table.dir),
  mtimeIdx: index('files_mtime_idx').on(table.mtime),
  kindIdx: index('files_kind_idx').on(table.kind),
  statusIdx: index('files_status_idx').on(table.status),
}));

// File metadata (EXIF, custom tags, extracted data)
export const fileMeta = sqliteTable('file_meta', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fileId: integer('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  key: text('key').notNull(), // 'exif.camera', 'custom.project', 'extracted.title'
  value: text('value').notNull(),
  source: text('source').notNull(), // 'exif', 'user', 'ai-extraction'
}, (table) => ({
  fileKeyIdx: index('file_meta_file_key_idx').on(table.fileId, table.key),
  keyIdx: index('file_meta_key_idx').on(table.key),
}));

// Text content for search (chunked for large files)
export const fileText = sqliteTable('file_text', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fileId: integer('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  chunkId: integer('chunk_id').notNull().default(0), // For large files split into chunks
  text: text('text').notNull(),
  tokenCount: integer('token_count'),
  language: text('language'), // Detected language
}, (table) => ({
  fileChunkIdx: index('file_text_file_chunk_idx').on(table.fileId, table.chunkId),
  fileIdx: index('file_text_file_idx').on(table.fileId),
}));

// Vector embeddings for semantic search
export const fileVectors = sqliteTable('file_vectors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fileId: integer('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  chunkId: integer('chunk_id').notNull().default(0),
  embedding: blob('embedding').notNull(), // Vector embedding as blob
  model: text('model').notNull(), // 'openai-ada-002', 'local-onnx-v1'
  dimension: integer('dimension').notNull(), // 1536, 768, etc.
}, (table) => ({
  fileChunkIdx: index('file_vectors_file_chunk_idx').on(table.fileId, table.chunkId),
  modelIdx: index('file_vectors_model_idx').on(table.model),
}));

// Tagging system
export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fileId: integer('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
  source: text('source').notNull(), // 'user', 'ai-auto', 'ai-suggested'
  confidence: real('confidence'), // 0.0-1.0 for AI tags
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  fileTagIdx: index('tags_file_tag_idx').on(table.fileId, table.tag),
  tagIdx: index('tags_tag_idx').on(table.tag),
  sourceIdx: index('tags_source_idx').on(table.source),
}));

// Indexing jobs tracking
export const jobs = sqliteTable('jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(), // 'scan-folder', 'extract-text', 'generate-embeddings'
  status: text('status').notNull(), // 'pending', 'running', 'completed', 'failed'
  progress: real('progress').default(0), // 0.0-1.0
  totalItems: integer('total_items'),
  processedItems: integer('processed_items').default(0),
  failedItems: integer('failed_items').default(0),
  params: text('params'), // JSON parameters
  error: text('error'),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  finishedAt: integer('finished_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  statusIdx: index('jobs_status_idx').on(table.status),
  typeIdx: index('jobs_type_idx').on(table.type),
  createdIdx: index('jobs_created_idx').on(table.createdAt),
}));

// Automation actions audit log
export const actions = sqliteTable('actions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kind: text('kind').notNull(), // 'screen-capture', 'app-control', 'file-operation'
  tool: text('tool').notNull(), // 'screenshot', 'applescript', 'file-rename'
  paramsJson: text('params_json').notNull(), // Serialized action parameters
  resultJson: text('result_json'), // Serialized action result
  status: text('status').notNull(), // 'requested', 'approved', 'executing', 'completed', 'failed'
  approvedBy: text('approved_by'), // 'user', 'auto-permission'
  error: text('error'),
  dryRun: integer('dry_run', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  executedAt: integer('executed_at', { mode: 'timestamp' }),
}, (table) => ({
  kindIdx: index('actions_kind_idx').on(table.kind),
  statusIdx: index('actions_status_idx').on(table.status),
  createdIdx: index('actions_created_idx').on(table.createdAt),
}));

// Permission system for automation
export const permissions = sqliteTable('permissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tool: text('tool').notNull(), // 'screen-capture', 'file-system', 'app-control'
  scope: text('scope').notNull(), // 'read-desktop', 'control-finder', 'write-documents'
  granted: integer('granted', { mode: 'boolean' }).notNull().default(false),
  grantedAt: integer('granted_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }), // TTL permissions
  rationale: text('rationale'), // Why permission was requested
  usageCount: integer('usage_count').default(0),
  lastUsed: integer('last_used', { mode: 'timestamp' }),
}, (table) => ({
  toolScopeIdx: index('permissions_tool_scope_idx').on(table.tool, table.scope),
  grantedIdx: index('permissions_granted_idx').on(table.granted),
  expiresIdx: index('permissions_expires_idx').on(table.expiresAt),
}));

// Collections/workspaces for organizing files
export const collections = sqliteTable('collections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color'), // UI color hint
  icon: text('icon'), // UI icon hint
  query: text('query'), // Saved search query for smart collections
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  nameIdx: index('collections_name_idx').on(table.name),
}));

// Many-to-many: files in collections
export const collectionFiles = sqliteTable('collection_files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  collectionId: integer('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  fileId: integer('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  addedAt: integer('added_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  collectionFileIdx: index('collection_files_collection_file_idx').on(table.collectionId, table.fileId),
  fileIdx: index('collection_files_file_idx').on(table.fileId),
}));