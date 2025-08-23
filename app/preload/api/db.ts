/**
 * Database API for preload
 * Provides access to database operations through IPC
 */

import { createInvokeWrapper, validatePositiveInteger } from '../ipc-wrapper';
import type {
  TestFilters, TestInsert, TestUpdate,
  ProviderFilters, ProviderInsert, ProviderUpdate,
  ModelFilters, ModelInsert, ModelUpdate,
  AgentFilters, AgentInsert, AgentUpdate
} from '../../main/db/types';

// Discussion and Message types for preload API
interface DiscussionFilters {
  isFavorite?: boolean;
  agentId?: number;
  search?: string;
}

interface CreateDiscussionPayload {
  title?: string;
  isFavorite?: boolean;
  agentId: number;
}

interface UpdateDiscussionPayload {
  id: number;
  title?: string;
  isFavorite?: boolean;
  agentId?: number;
}

interface MessageFilters {
  discussionId?: number;
  who?: 'user' | 'agent';
}

interface CreateMessagePayload {
  who: 'user' | 'agent';
  content: string;
  discussionId: number;
}

/**
 * Generic CRUD API factory for database entities
 */
function createCrudApi<TFilters, TInsert, TUpdate, TEntity>(prefix: string) {
  return {
    list: createInvokeWrapper<[TFilters?], TEntity[]>(`${prefix}:list`),
    insert: createInvokeWrapper<[TInsert], TEntity>(`${prefix}:insert`),
    update: createInvokeWrapper<[TUpdate], TEntity>(`${prefix}:update`),
    delete(id: number) {
      validatePositiveInteger(id, 'id');
      return createInvokeWrapper<[number], { ok: true }>(`${prefix}:delete`)(id);
    },
  };
}

// Test table API
export const testApi = {
  ...createCrudApi<TestFilters, TestInsert, TestUpdate, { id: number; column1: string | null; column2: string | null }>('db:test'),
  truncate: createInvokeWrapper<[], { ok: true }>('db:test:truncate'),
};

// Admin APIs
export const adminApi = {
  providers: createCrudApi<ProviderFilters, ProviderInsert, ProviderUpdate, { id: number; code: string; name: string; url: string; authentication: string; secretKey?: string; configuration: string; createdAt: Date; updatedAt: Date }>('db:admin:providers'),
  models: createCrudApi<ModelFilters, ModelInsert, ModelUpdate, { id: number; code: string; name: string; model: string; inputPrice?: number; outputPrice?: number; endpoint: string; params: string; messageLocation?: string; messageStreamLocation?: string; inputTokenCountLocation?: string; outputTokenCountLocation?: string; providerId: number; createdAt: Date; updatedAt: Date }>('db:admin:models'),
  agents: createCrudApi<AgentFilters, AgentInsert, AgentUpdate, { id: number; code: string; name: string; description: string; version: string; enable: boolean; isSystem: boolean; systemPrompt?: string; configuration: string; modelId: number; createdAt: Date; updatedAt: Date }>('db:admin:agents'),
};

// Discussion API
export const discussionsApi = {
  list: createInvokeWrapper<[DiscussionFilters?], { id: number; title: string; isFavorite: boolean; agentId: number; createdAt: Date; updatedAt: Date }[]>('db:discussions:list'),
  create: createInvokeWrapper<[CreateDiscussionPayload], { id: number; title: string; isFavorite: boolean; agentId: number; createdAt: Date; updatedAt: Date }>('db:discussions:create'),
  update: createInvokeWrapper<[UpdateDiscussionPayload], { id: number; title: string; isFavorite: boolean; agentId: number; createdAt: Date; updatedAt: Date }>('db:discussions:update'),
  delete(id: number) {
    validatePositiveInteger(id, 'id');
    return createInvokeWrapper<[number], { ok: true }>('db:discussions:delete')(id);
  },
  getWithMessages(discussionId: number) {
    validatePositiveInteger(discussionId, 'discussionId');
    return createInvokeWrapper<[number], { id: number; title: string; isFavorite: boolean; agentId: number; createdAt: Date; updatedAt: Date; messages: { id: number; who: 'user' | 'agent'; content: string; discussionId: number; createdAt: Date }[] }>('db:discussions:getWithMessages')(discussionId);
  },
  toggleFavorite(discussionId: number) {
    validatePositiveInteger(discussionId, 'discussionId');
    return createInvokeWrapper<[number], { id: number; title: string; isFavorite: boolean; agentId: number; createdAt: Date; updatedAt: Date }>('db:discussions:toggleFavorite')(discussionId);
  },
};

// Messages API
export const messagesApi = {
  list: createInvokeWrapper<[MessageFilters?], { id: number; who: 'user' | 'agent'; content: string; discussionId: number; createdAt: Date }[]>('db:messages:list'),
  create: createInvokeWrapper<[CreateMessagePayload], { id: number; who: 'user' | 'agent'; content: string; discussionId: number; createdAt: Date }>('db:messages:create'),
  getByDiscussion(discussionId: number) {
    validatePositiveInteger(discussionId, 'discussionId');
    return createInvokeWrapper<[number], { id: number; who: 'user' | 'agent'; content: string; discussionId: number; createdAt: Date }[]>('db:messages:getByDiscussion')(discussionId);
  },
  getLastMessages(discussionId: number, limit?: number) {
    validatePositiveInteger(discussionId, 'discussionId');
    if (limit !== undefined) validatePositiveInteger(limit, 'limit');
    return createInvokeWrapper<[number, number?], { id: number; who: 'user' | 'agent'; content: string; discussionId: number; createdAt: Date }[]>('db:messages:getLastMessages')(discussionId, limit);
  },
  countByDiscussion(discussionId: number) {
    validatePositiveInteger(discussionId, 'discussionId');
    return createInvokeWrapper<[number], number>('db:messages:countByDiscussion')(discussionId);
  },
  deleteByDiscussion(discussionId: number) {
    validatePositiveInteger(discussionId, 'discussionId');
    return createInvokeWrapper<[number], { ok: true }>('db:messages:deleteByDiscussion')(discussionId);
  },
};