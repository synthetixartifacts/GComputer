import { eq } from 'drizzle-orm';
import { configurations } from '../../../../packages/db/src/db/schema.js';
import { BaseService } from './base-service.js';
import type { ConfigurationFilters, ConfigurationInsert, ConfigurationUpdate } from '../types.js';

/**
 * Service for configuration operations
 * Extends BaseService with configuration-specific logic
 */
export class ConfigurationService extends BaseService<any, ConfigurationFilters, ConfigurationInsert, ConfigurationUpdate> {
  protected tableName = 'configurations';
  protected table = configurations;

  /**
   * Build where clauses for configuration filtering
   */
  protected buildWhereClause(filters: ConfigurationFilters): any[] {
    const clauses = [
      this.buildLikeClause(configurations.code, filters.code),
      this.buildLikeClause(configurations.name, filters.name),
      this.buildEqualClause(configurations.category, filters.category),
      this.buildEqualClause(configurations.type, filters.type),
    ];
    
    return this.filterClauses(clauses);
  }

  /**
   * Prepare insert data with timestamps and defaults
   */
  protected prepareInsertData(payload: ConfigurationInsert): any {
    const now = new Date();
    return {
      code: payload.code,
      name: payload.name,
      type: payload.type,
      value: payload.value,
      defaultValue: payload.defaultValue,
      options: payload.options ?? null,
      description: payload.description ?? null,
      category: payload.category ?? 'general',
      isSystem: payload.isSystem ?? false,
      isSecret: payload.isSecret ?? false,
      validation: payload.validation ?? null,
      createdAt: now,
      updatedAt: now,
    } as const;
  }

  /**
   * Prepare update data with updated timestamp
   */
  protected prepareUpdateData(payload: ConfigurationUpdate): any {
    const { id, ...updates } = payload;
    return {
      ...updates,
      updatedAt: new Date(),
    };
  }

  /**
   * Get configuration value by code
   */
  async getByCode(code: string): Promise<any | null> {
    const orm = await this.getOrm();
    const rows = await orm
      .select()
      .from(configurations)
      .where(eq(configurations.code, code))
      .limit(1);
    
    return rows[0] ?? null;
  }

  /**
   * Update configuration value by code
   */
  async updateByCode(code: string, value: string): Promise<any | null> {
    const orm = await this.getOrm();
    const res = await orm
      .update(configurations)
      .set({ 
        value, 
        updatedAt: new Date() 
      })
      .where(eq(configurations.code, code))
      .returning();
    
    return res[0] ?? null;
  }

  /**
   * List configurations with ordering by category and name
   */
  async list(filters?: ConfigurationFilters): Promise<any[]> {
    const orm = await this.getOrm();
    const f = filters ?? {} as ConfigurationFilters;
    const whereClauses = this.buildWhereClause(f);

    const rows = await orm
      .select()
      .from(configurations)
      .where(whereClauses.length ? this.buildAndClause(...whereClauses) : undefined)
      .orderBy(configurations.category, configurations.name);
    
    return rows;
  }

  /**
   * Get all configuration values as a key-value map
   */
  async getAllAsMap(): Promise<Record<string, string>> {
    const rows = await this.list();
    const map: Record<string, string> = {};
    
    for (const row of rows) {
      if (!row.isSecret) {
        map[row.code] = row.value;
      }
    }
    
    return map;
  }
}

// Singleton instance
export const configurationService = new ConfigurationService();