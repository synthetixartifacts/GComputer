/**
 * Database API for preload
 * Provides access to database operations through IPC
 */

import { createInvokeWrapper, validatePositiveInteger } from '../ipc-wrapper';

/**
 * Generic CRUD API factory for database entities
 */
function createCrudApi<TFilters, TInsert, TUpdate>(prefix: string) {
  return {
    list: createInvokeWrapper<[TFilters?], any[]>(`${prefix}:list`),
    insert: createInvokeWrapper<[TInsert], any>(`${prefix}:insert`),
    update: createInvokeWrapper<[TUpdate], any>(`${prefix}:update`),
    delete(id: number) {
      validatePositiveInteger(id, 'id');
      return createInvokeWrapper<[number], any>(`${prefix}:delete`)(id);
    },
  };
}

// Test table API
export const testApi = {
  ...createCrudApi<any, any, any>('db:test'),
  truncate: createInvokeWrapper<[], any>('db:test:truncate'),
};

// Admin APIs
export const adminApi = {
  providers: createCrudApi<any, any, any>('db:admin:providers'),
  models: createCrudApi<any, any, any>('db:admin:models'),
  agents: createCrudApi<any, any, any>('db:admin:agents'),
};

// Discussion API
export const discussionsApi = {
  list: createInvokeWrapper<[any?], any[]>('db:discussions:list'),
  create: createInvokeWrapper<[any], any>('db:discussions:create'),
  update: createInvokeWrapper<[any], any>('db:discussions:update'),
  delete(id: number) {
    validatePositiveInteger(id, 'id');
    return createInvokeWrapper<[number], any>('db:discussions:delete')(id);
  },
  getWithMessages(discussionId: number) {
    validatePositiveInteger(discussionId, 'discussionId');
    return createInvokeWrapper<[number], any>('db:discussions:getWithMessages')(discussionId);
  },
  toggleFavorite(discussionId: number) {
    validatePositiveInteger(discussionId, 'discussionId');
    return createInvokeWrapper<[number], any>('db:discussions:toggleFavorite')(discussionId);
  },
};

// Messages API
export const messagesApi = {
  list: createInvokeWrapper<[any?], any[]>('db:messages:list'),
  create: createInvokeWrapper<[any], any>('db:messages:create'),
  getByDiscussion(discussionId: number) {
    validatePositiveInteger(discussionId, 'discussionId');
    return createInvokeWrapper<[number], any[]>('db:messages:getByDiscussion')(discussionId);
  },
  getLastMessages(discussionId: number, limit?: number) {
    validatePositiveInteger(discussionId, 'discussionId');
    if (limit !== undefined) validatePositiveInteger(limit, 'limit');
    return createInvokeWrapper<[number, number?], any[]>('db:messages:getLastMessages')(discussionId, limit);
  },
  countByDiscussion(discussionId: number) {
    validatePositiveInteger(discussionId, 'discussionId');
    return createInvokeWrapper<[number], number>('db:messages:countByDiscussion')(discussionId);
  },
  deleteByDiscussion(discussionId: number) {
    validatePositiveInteger(discussionId, 'discussionId');
    return createInvokeWrapper<[number], any>('db:messages:deleteByDiscussion')(discussionId);
  },
};