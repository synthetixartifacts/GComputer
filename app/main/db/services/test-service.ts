import { test } from '../../../../packages/db/src/db/schema.js';
import { BaseService } from './base-service.js';
import type { TestFilters, TestInsert, TestUpdate } from '../types.js';

/**
 * Service for test table operations
 * Extends BaseService with test-specific logic
 */
export class TestService extends BaseService<any, TestFilters, TestInsert, TestUpdate> {
  protected tableName = 'test';
  protected table = test;

  /**
   * Build where clauses for test table filtering
   */
  protected buildWhereClause(filters: TestFilters): any[] {
    const clauses = [
      this.buildLikeClause(test.column1, filters.column1),
      this.buildLikeClause(test.column2, filters.column2),
    ];
    
    return this.filterClauses(clauses);
  }

  /**
   * Prepare insert data with null handling
   */
  protected prepareInsertData(payload: TestInsert): any {
    return {
      column1: payload.column1 ?? null,
      column2: payload.column2 ?? null,
    } as const;
  }

  /**
   * Prepare update data with conditional field updates
   */
  protected prepareUpdateData(payload: TestUpdate): any {
    const { id, column1, column2 } = payload;
    return {
      ...(column1 !== undefined ? { column1 } : {}),
      ...(column2 !== undefined ? { column2 } : {}),
    };
  }
}

// Singleton instance
export const testService = new TestService();