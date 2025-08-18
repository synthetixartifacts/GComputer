import { describe, test, expect, beforeEach, vi } from 'vitest';
import { BaseService } from '../base-service';
import { eq, like, and } from 'drizzle-orm';
import { getOrm, saveDatabase } from '../../../../../packages/db/src/db/client.js';

// Mock the database client
vi.mock('../../../../../packages/db/src/db/client.js', () => ({
  getOrm: vi.fn(),
  saveDatabase: vi.fn(),
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ type: 'eq', field, value })),
  like: vi.fn((field, pattern) => ({ type: 'like', field, pattern })),
  and: vi.fn((...clauses) => ({ type: 'and', clauses })),
}));

// Create a concrete implementation for testing
class TestService extends BaseService<any, any, any, any> {
  protected tableName = 'test_table';
  protected table = { id: 'test_id_field', name: 'test_name_field' } as any;
  
  protected buildWhereClause(filters: any): any[] {
    const clauses = [];
    if (filters.id !== undefined) {
      clauses.push(this.buildLikeClause(this.table.id, filters.id));
    }
    if (filters.name !== undefined) {
      clauses.push(this.buildLikeClause(this.table.name, filters.name));
    }
    return this.filterClauses(clauses);
  }
  
  protected prepareInsertData(payload: any): any {
    const now = new Date();
    return {
      ...payload,
      createdAt: now,
      updatedAt: now,
    };
  }
  
  protected prepareUpdateData(payload: any): any {
    const { id, ...updates } = payload;
    return {
      ...updates,
      updatedAt: new Date(),
    };
  }
}

describe('BaseService', () => {
  let service: TestService;
  let mockOrm: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    service = new TestService();
    
    // Create a properly chained mock ORM
    const createChainableMock = () => {
      // Track chain state to determine behavior
      let isUpdateContext = false;
      let isDeleteContext = false;
      
      const chain = {
        select: vi.fn(),
        from: vi.fn(),
        where: vi.fn(),
        insert: vi.fn(),
        values: vi.fn(),
        returning: vi.fn(),
        update: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
        orderBy: vi.fn(),
      };
      
      // Set up different behaviors based on context
      chain.select.mockReturnValue(chain);
      chain.from.mockReturnValue(chain);
      
      // Update context chains differently
      chain.update.mockImplementation(() => {
        isUpdateContext = true;
        return chain;
      });
      
      // Delete context
      chain.delete.mockImplementation(() => {
        isDeleteContext = true;
        return chain;
      });
      
      chain.set.mockReturnValue(chain);
      
      // Where behaves differently based on context
      chain.where.mockImplementation(() => {
        if (isUpdateContext || isDeleteContext) {
          return chain; // Continue chaining for update/delete
        } else {
          return Promise.resolve([]); // Resolve directly for select
        }
      });
      
      chain.insert.mockReturnValue(chain);
      chain.values.mockReturnValue(chain);
      chain.returning.mockResolvedValue([{ id: 1 }]);
      chain.orderBy.mockResolvedValue([]);
      
      return chain;
    };
    
    mockOrm = createChainableMock();
    
    // Mock the database client
    vi.mocked(getOrm).mockResolvedValue(mockOrm);
    vi.mocked(saveDatabase).mockResolvedValue(undefined);
  });
  
  describe('list', () => {
    test('should list all items without filters', async () => {
      const mockData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];
      
      mockOrm.where.mockResolvedValue(mockData);
      
      const result = await service.list();
      
      expect(mockOrm.select).toHaveBeenCalled();
      expect(mockOrm.from).toHaveBeenCalledWith(service['table']);
      expect(result).toEqual(mockData);
    });
    
    test('should apply filters when provided', async () => {
      const mockData = [{ id: 1, name: 'Filtered Item' }];
      const filters = { name: 'Filtered' };
      
      mockOrm.where.mockResolvedValue(mockData);
      
      const result = await service.list(filters);
      
      expect(mockOrm.where).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
    
    test('should handle empty results', async () => {
      mockOrm.where.mockResolvedValue([]);
      
      const result = await service.list();
      
      expect(result).toEqual([]);
    });
  });
  
  
  describe('update', () => {
    test('should update existing item', async () => {
      const payload = { id: 1, name: 'Updated Item' };
      const updated = { ...payload, updatedAt: expect.any(Date) };
      
      mockOrm.returning.mockResolvedValue([updated]);
      
      const result = await service.update(payload);
      
      expect(mockOrm.update).toHaveBeenCalledWith(service['table']);
      expect(mockOrm.set).toHaveBeenCalled();
      expect(mockOrm.where).toHaveBeenCalled();
      expect(mockOrm.returning).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });
    
    test('should update timestamp on update', async () => {
      const payload = { id: 1, name: 'Updated Item' };
      
      mockOrm.returning.mockResolvedValue([payload]);
      
      await service.update(payload);
      
      const setCall = mockOrm.set.mock.calls[0][0];
      expect(setCall).toHaveProperty('updatedAt');
      expect(setCall.updatedAt).toBeInstanceOf(Date);
    });
    
    test('should return null if item not found', async () => {
      mockOrm.returning.mockResolvedValue([]);
      
      const result = await service.update({ id: 999, name: 'Not Found' });
      
      expect(result).toBeNull();
    });
  });
  
  describe('delete', () => {
    test('should delete item by id', async () => {
      mockOrm.returning.mockResolvedValue([{ id: 1 }]);
      
      const result = await service.delete(1);
      
      expect(mockOrm.delete).toHaveBeenCalledWith(service['table']);
      expect(mockOrm.where).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });
    
    test('should return ok: true even if item not found', async () => {
      mockOrm.returning.mockResolvedValue([]);
      
      const result = await service.delete(999);
      
      expect(result).toEqual({ ok: true });
    });
  });
  
  describe('helper methods', () => {
    describe('buildEqualClause', () => {
      test('should build equal clause for defined value', () => {
        const field = 'testField';
        const value = 'testValue';
        
        const result = service['buildEqualClause'](field, value);
        
        expect(eq).toHaveBeenCalledWith(field, value);
        expect(result).toBeDefined();
      });
      
      test('should return undefined for undefined value', () => {
        const result = service['buildEqualClause']('field', undefined);
        
        expect(result).toBeUndefined();
      });
    });
    
    describe('buildLikeClause', () => {
      test('should build like clause with wildcards', () => {
        const field = 'nameField';
        const value = 'search';
        
        const result = service['buildLikeClause'](field, value);
        
        expect(like).toHaveBeenCalledWith(field, '%search%');
        expect(result).toBeDefined();
      });
      
      test('should return undefined for undefined value', () => {
        const result = service['buildLikeClause']('field', undefined);
        
        expect(result).toBeUndefined();
      });
      
      test('should return undefined for empty string', () => {
        const result = service['buildLikeClause']('field', '');
        
        expect(result).toBeUndefined();
      });
    });
    
    describe('filterClauses', () => {
      test('should filter out undefined clauses', () => {
        const clauses = [
          { type: 'eq', field: 'id', value: 1 },
          undefined,
          { type: 'like', field: 'name', value: 'test' },
          undefined,
        ];
        
        const result = service['filterClauses'](clauses);
        
        expect(result).toHaveLength(2);
        expect(result).not.toContain(undefined);
      });
      
      test('should return empty array for all undefined', () => {
        const clauses = [undefined, undefined];
        
        const result = service['filterClauses'](clauses);
        
        expect(result).toEqual([]);
      });
    });
    
    describe('combineWhereClauses', () => {
      test('should combine multiple clauses with AND', () => {
        const clauses = [
          { type: 'eq', field: 'id', value: 1 },
          { type: 'like', field: 'name', value: 'test' },
        ];
        
        const result = service['combineWhereClauses'](clauses);
        
        expect(and).toHaveBeenCalledWith(...clauses);
        expect(result).toBeDefined();
      });
      
      test('should return single clause without AND', () => {
        const clause = { type: 'eq', field: 'id', value: 1 };
        
        const result = service['combineWhereClauses']([clause]);
        
        expect(and).not.toHaveBeenCalled();
        expect(result).toEqual(clause);
      });
      
      test('should return undefined for empty array', () => {
        const result = service['combineWhereClauses']([]);
        
        expect(result).toBeUndefined();
      });
    });
  });
  
  describe('error handling', () => {
    test('should handle database errors in list', async () => {
      const error = new Error('Database connection failed');
      vi.mocked(getOrm).mockRejectedValue(error);
      
      await expect(service.list()).rejects.toThrow('Database connection failed');
    });
    
    test('should handle database errors in create', async () => {
      const error = new Error('Constraint violation');
      vi.mocked(getOrm).mockRejectedValue(error);
      
      await expect(service.create({ name: 'Test' })).rejects.toThrow('Constraint violation');
    });
  });
  
  describe('getOrm access', () => {
    test('should expose getOrm to subclasses', async () => {
      const orm = await service['getOrm']();
      
      expect(getOrm).toHaveBeenCalledTimes(1);
      expect(orm).toBe(mockOrm);
    });
  });
});