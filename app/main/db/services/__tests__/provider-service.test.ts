import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ProviderService } from '../provider-service';
import { aiProviders } from '../../../../../packages/db/src/db/schema.js';
import { getOrm, saveDatabase } from '../../../../../packages/db/src/db/client.js';
import { like, and, eq } from 'drizzle-orm';
import type { ProviderFilters, ProviderInsert, ProviderUpdate } from '../types.js';

// Mock the database client
vi.mock('../../../../../packages/db/src/db/client.js', () => ({
  getOrm: vi.fn(),
  saveDatabase: vi.fn(),
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  like: vi.fn((field, pattern) => ({ type: 'like', field, pattern })),
  and: vi.fn((...clauses) => ({ type: 'and', clauses })),
  eq: vi.fn((field, value) => ({ type: 'eq', field, value })),
}));

// Mock the schema
vi.mock('../../../../../packages/db/src/db/schema.js', () => ({
  aiProviders: {
    id: 'ai_providers_id',
    code: 'ai_providers_code',
    name: 'ai_providers_name',
    url: 'ai_providers_url',
  },
}));

describe('ProviderService', () => {
  let service: ProviderService;
  let mockOrm: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProviderService();

    // Setup comprehensive mock ORM with proper chaining
    const createChainableMock = () => {
      const chain = {
        select: vi.fn(),
        from: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        insert: vi.fn(),
        values: vi.fn(),
        returning: vi.fn(),
        update: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };
      
      // Set up the chain
      chain.select.mockReturnValue(chain);
      chain.from.mockReturnValue(chain);
      chain.where.mockReturnValue(chain);
      chain.orderBy.mockResolvedValue([]); // Terminal for list queries
      chain.insert.mockReturnValue(chain);
      chain.values.mockReturnValue(chain);
      chain.returning.mockResolvedValue([{ id: 1 }]);
      chain.update.mockReturnValue(chain);
      chain.set.mockReturnValue(chain);
      chain.delete.mockReturnValue(chain);
      
      return chain;
    };
    
    mockOrm = createChainableMock();

    vi.mocked(getOrm).mockResolvedValue(mockOrm);
    vi.mocked(saveDatabase).mockResolvedValue(undefined);
  });

  describe('list', () => {
    const mockProviders = [
      {
        id: 1,
        code: 'openai',
        name: 'OpenAI',
        url: 'https://api.openai.com',
        authentication: 'bearer',
        secretKey: 'sk-test',
        configuration: '{}',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 2,
        code: 'anthropic',
        name: 'Anthropic',
        url: 'https://api.anthropic.com',
        authentication: 'bearer',
        secretKey: 'sk-ant-test',
        configuration: '{}',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
    ];

    test('should list all providers ordered by name', async () => {
      mockOrm.orderBy.mockResolvedValue(mockProviders);

      const result = await service.list();

      expect(mockOrm.select).toHaveBeenCalled();
      expect(mockOrm.from).toHaveBeenCalledWith(aiProviders);
      expect(mockOrm.orderBy).toHaveBeenCalled();
      expect(result).toEqual(mockProviders);
    });

    test('should filter providers by code', async () => {
      const filters: ProviderFilters = { code: 'openai' };
      const filteredProviders = [mockProviders[0]];
      mockOrm.orderBy.mockResolvedValue(filteredProviders);

      const result = await service.list(filters);

      expect(mockOrm.where).toHaveBeenCalled();
      expect(like).toHaveBeenCalledWith(aiProviders.code, '%openai%');
      expect(result).toEqual(filteredProviders);
    });

    test('should filter providers by name', async () => {
      const filters: ProviderFilters = { name: 'OpenAI' };
      const filteredProviders = [mockProviders[0]];
      mockOrm.orderBy.mockResolvedValue(filteredProviders);

      const result = await service.list(filters);

      expect(like).toHaveBeenCalledWith(aiProviders.name, '%OpenAI%');
      expect(result).toEqual(filteredProviders);
    });

    test('should filter providers by URL', async () => {
      const filters: ProviderFilters = { url: 'openai.com' };
      const filteredProviders = [mockProviders[0]];
      mockOrm.orderBy.mockResolvedValue(filteredProviders);

      const result = await service.list(filters);

      expect(like).toHaveBeenCalledWith(aiProviders.url, '%openai.com%');
      expect(result).toEqual(filteredProviders);
    });

    test('should combine multiple filters with AND', async () => {
      const filters: ProviderFilters = { 
        code: 'openai', 
        name: 'OpenAI' 
      };
      mockOrm.orderBy.mockResolvedValue([mockProviders[0]]);

      await service.list(filters);

      expect(and).toHaveBeenCalled();
      expect(like).toHaveBeenCalledWith(aiProviders.code, '%openai%');
      expect(like).toHaveBeenCalledWith(aiProviders.name, '%OpenAI%');
    });

    test('should ignore empty filter values', async () => {
      const filters: ProviderFilters = { 
        code: '', 
        name: 'OpenAI',
        url: '   ' // whitespace only
      };
      mockOrm.orderBy.mockResolvedValue([mockProviders[0]]);

      await service.list(filters);

      // Should only call like for name (non-empty value)
      expect(like).toHaveBeenCalledTimes(1);
      expect(like).toHaveBeenCalledWith(aiProviders.name, '%OpenAI%');
    });

    test('should handle database errors during list', async () => {
      const error = new Error('Database connection failed');
      vi.mocked(getOrm).mockRejectedValue(error);

      await expect(service.list()).rejects.toThrow('Database connection failed');
    });
  });

  describe('insert', () => {
    test('should insert provider with required fields', async () => {
      const insertData: ProviderInsert = {
        code: 'test-provider',
        name: 'Test Provider',
        url: 'https://api.test.com',
        authentication: 'bearer',
      };

      const mockResult = {
        id: 1,
        ...insertData,
        secretKey: null,
        configuration: '{}',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      mockOrm.returning.mockResolvedValue([mockResult]);

      const result = await service.insert(insertData);

      expect(mockOrm.insert).toHaveBeenCalledWith(aiProviders);
      expect(mockOrm.values).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'test-provider',
          name: 'Test Provider',
          url: 'https://api.test.com',
          authentication: 'bearer',
          secretKey: null,
          configuration: '{}',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
      expect(saveDatabase).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    test('should insert provider with optional fields', async () => {
      const insertData: ProviderInsert = {
        code: 'test-provider',
        name: 'Test Provider',
        url: 'https://api.test.com',
        authentication: 'bearer',
        secretKey: 'sk-test-key',
        configuration: '{"temperature": 0.7}',
      };

      const mockResult = { id: 1, ...insertData };
      mockOrm.returning.mockResolvedValue([mockResult]);

      const result = await service.insert(insertData);

      expect(mockOrm.values).toHaveBeenCalledWith(
        expect.objectContaining({
          secretKey: 'sk-test-key',
          configuration: '{"temperature": 0.7}',
        })
      );
      expect(result).toEqual(mockResult);
    });

    test('should handle insert failures', async () => {
      mockOrm.returning.mockResolvedValue([]);

      const result = await service.insert({
        code: 'test',
        name: 'Test',
        url: 'https://test.com',
        authentication: 'bearer',
      });

      expect(result).toBeNull();
    });

    test('should handle database errors during insert', async () => {
      const error = new Error('Unique constraint violation');
      vi.mocked(getOrm).mockRejectedValue(error);

      await expect(service.insert({
        code: 'duplicate',
        name: 'Duplicate',
        url: 'https://duplicate.com',
        authentication: 'bearer',
      })).rejects.toThrow('Unique constraint violation');
    });
  });

  describe('update', () => {
    test('should update provider and preserve updatedAt timestamp', async () => {
      const updateData: ProviderUpdate = {
        id: 1,
        name: 'Updated Provider',
        url: 'https://updated.com',
      };

      const mockResult = {
        id: 1,
        code: 'test-provider',
        name: 'Updated Provider',
        url: 'https://updated.com',
        authentication: 'bearer',
        updatedAt: expect.any(Date),
      };

      mockOrm.returning.mockResolvedValue([mockResult]);

      const result = await service.update(updateData);

      expect(mockOrm.update).toHaveBeenCalledWith(aiProviders);
      expect(mockOrm.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Provider',
          url: 'https://updated.com',
          updatedAt: expect.any(Date),
        })
      );
      expect(mockOrm.where).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'eq' })
      );
      expect(saveDatabase).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    test('should return null if provider not found', async () => {
      mockOrm.returning.mockResolvedValue([]);

      const result = await service.update({
        id: 999,
        name: 'Non-existent',
      });

      expect(result).toBeNull();
    });

    test('should handle database errors during update', async () => {
      const error = new Error('Update constraint violation');
      vi.mocked(getOrm).mockRejectedValue(error);

      await expect(service.update({
        id: 1,
        name: 'Test',
      })).rejects.toThrow('Update constraint violation');
    });
  });

  describe('delete', () => {
    test('should delete provider by id', async () => {
      const result = await service.delete(1);

      expect(mockOrm.delete).toHaveBeenCalledWith(aiProviders);
      expect(mockOrm.where).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'eq' })
      );
      expect(eq).toHaveBeenCalledWith(aiProviders.id, 1);
      expect(saveDatabase).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });

    test('should handle database errors during delete', async () => {
      const error = new Error('Foreign key constraint');
      vi.mocked(getOrm).mockRejectedValue(error);

      await expect(service.delete(1)).rejects.toThrow('Foreign key constraint');
    });
  });

  describe('data preparation methods', () => {
    test('prepareInsertData should add timestamps and defaults', () => {
      const payload: ProviderInsert = {
        code: 'test',
        name: 'Test',
        url: 'https://test.com',
        authentication: 'bearer',
      };

      const prepared = service['prepareInsertData'](payload);

      expect(prepared).toEqual({
        code: 'test',
        name: 'Test',
        url: 'https://test.com',
        authentication: 'bearer',
        secretKey: null,
        configuration: '{}',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(prepared.createdAt).toBeInstanceOf(Date);
      expect(prepared.updatedAt).toBeInstanceOf(Date);
    });

    test('prepareInsertData should preserve provided optional fields', () => {
      const payload: ProviderInsert = {
        code: 'test',
        name: 'Test',
        url: 'https://test.com',
        authentication: 'bearer',
        secretKey: 'sk-provided',
        configuration: '{"custom": true}',
      };

      const prepared = service['prepareInsertData'](payload);

      expect(prepared.secretKey).toBe('sk-provided');
      expect(prepared.configuration).toBe('{"custom": true}');
    });

    test('prepareUpdateData should exclude id and add updatedAt', () => {
      const payload: ProviderUpdate = {
        id: 1,
        name: 'Updated',
        authentication: 'api-key',
      };

      const prepared = service['prepareUpdateData'](payload);

      expect(prepared).not.toHaveProperty('id');
      expect(prepared).toEqual({
        name: 'Updated',
        authentication: 'api-key',
        updatedAt: expect.any(Date),
      });
      expect(prepared.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('where clause building', () => {
    test('should build correct where clauses for all filters', () => {
      const filters: ProviderFilters = {
        code: 'openai',
        name: 'OpenAI',
        url: 'api.openai.com',
      };

      const whereClauses = service['buildWhereClause'](filters);

      expect(whereClauses).toHaveLength(3);
      expect(like).toHaveBeenCalledWith(aiProviders.code, '%openai%');
      expect(like).toHaveBeenCalledWith(aiProviders.name, '%OpenAI%');
      expect(like).toHaveBeenCalledWith(aiProviders.url, '%api.openai.com%');
    });

    test('should filter out empty values', () => {
      const filters: ProviderFilters = {
        code: 'openai',
        name: '',
        url: undefined,
      };

      const whereClauses = service['buildWhereClause'](filters);

      expect(whereClauses).toHaveLength(1);
      expect(like).toHaveBeenCalledWith(aiProviders.code, '%openai%');
      expect(like).not.toHaveBeenCalledWith(aiProviders.name, expect.any(String));
      expect(like).not.toHaveBeenCalledWith(aiProviders.url, expect.any(String));
    });
  });

  describe('service configuration', () => {
    test('should have correct table configuration', () => {
      expect(service['tableName']).toBe('ai_providers');
      expect(service['table']).toBe(aiProviders);
    });
  });
});