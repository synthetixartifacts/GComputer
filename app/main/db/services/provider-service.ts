import { aiProviders } from '../../../../packages/db/src/db/schema.js';
import { BaseService } from './base-service.js';
import type { ProviderFilters, ProviderInsert, ProviderUpdate } from '../types.js';

/**
 * Service for AI providers operations
 * Extends BaseService with provider-specific logic
 */
export class ProviderService extends BaseService<any, ProviderFilters, ProviderInsert, ProviderUpdate> {
  protected tableName = 'ai_providers';
  protected table = aiProviders;

  /**
   * Build where clauses for provider filtering
   */
  protected buildWhereClause(filters: ProviderFilters): any[] {
    const clauses = [
      this.buildLikeClause(aiProviders.code, filters.code),
      this.buildLikeClause(aiProviders.name, filters.name),
      this.buildLikeClause(aiProviders.url, filters.url),
    ];
    
    return this.filterClauses(clauses);
  }

  /**
   * Prepare insert data with timestamps and defaults
   */
  protected prepareInsertData(payload: ProviderInsert): any {
    const now = new Date();
    return {
      code: payload.code,
      name: payload.name,
      url: payload.url,
      authentication: payload.authentication,
      configuration: payload.configuration ?? '{}',
      createdAt: now,
      updatedAt: now,
    } as const;
  }

  /**
   * Prepare update data with updated timestamp
   */
  protected prepareUpdateData(payload: ProviderUpdate): any {
    const { id, ...updates } = payload;
    return {
      ...updates,
      updatedAt: new Date(),
    };
  }

  /**
   * List providers with ordering by name
   */
  async list(filters?: ProviderFilters): Promise<any[]> {
    const orm = await this.getOrm();
    const f = filters ?? {} as ProviderFilters;
    const whereClauses = this.buildWhereClause(f);

    const rows = await orm
      .select()
      .from(this.table)
      .where(whereClauses.length ? this.buildAndClause(...whereClauses) : undefined)
      .orderBy(aiProviders.name);
    
    return rows;
  }
}

// Singleton instance
export const providerService = new ProviderService();