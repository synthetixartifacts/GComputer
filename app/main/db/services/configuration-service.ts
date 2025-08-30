import { eq } from 'drizzle-orm';
import { configurations } from '../../../../packages/db/src/db/schema.js';
import { BaseService } from './base-service.js';
import type { Configuration, ConfigurationFilters, ConfigurationInsert, ConfigurationUpdate } from '../types.js';

/**
 * Service for configuration operations
 * Extends BaseService with configuration-specific logic
 */
export class ConfigurationService extends BaseService<Configuration, ConfigurationFilters, ConfigurationInsert, ConfigurationUpdate> {
  protected tableName = 'configurations';
  protected table = configurations;

  /**
   * Build where clauses for configuration filtering
   */
  protected buildWhereClause(filters: ConfigurationFilters): unknown[] {
    const clauses = [
      this.buildLikeClause(configurations.code, filters.code),
      this.buildLikeClause(configurations.name, filters.name),
    ];
    
    return this.filterClauses(clauses);
  }

  /**
   * Prepare insert data with timestamps and defaults
   */
  protected prepareInsertData(payload: ConfigurationInsert): Omit<Configuration, 'id'> {
    const now = new Date();
    return {
      code: payload.code,
      name: payload.name,
      value: payload.value,
      defaultValue: payload.defaultValue,
      description: payload.description ?? null,
      createdAt: now,
      updatedAt: now,
    } as const;
  }

  /**
   * Prepare update data with updated timestamp
   */
  protected prepareUpdateData(payload: ConfigurationUpdate): Partial<Configuration> {
    const { id, ...updates } = payload;
    return {
      ...updates,
      updatedAt: new Date(),
    };
  }

  /**
   * Get configuration value by code
   */
  async getByCode(code: string): Promise<Configuration | null> {
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
  async updateByCode(code: string, value: string): Promise<Configuration | null> {
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
  async list(filters?: ConfigurationFilters): Promise<Configuration[]> {
    const orm = await this.getOrm();
    const f = filters ?? {} as ConfigurationFilters;
    const whereClauses = this.buildWhereClause(f);

    const rows = await orm
      .select()
      .from(configurations)
      .where(whereClauses.length ? this.buildAndClause(...whereClauses) : undefined)
      .orderBy(configurations.name);
    
    return rows;
  }

  /**
   * Get all configuration values as a key-value map
   */
  async getAllAsMap(): Promise<Record<string, string>> {
    const orm = await this.getOrm();
    const rows = await orm
      .select({
        code: configurations.code,
        value: configurations.value
      })
      .from(configurations)
      .orderBy(configurations.name);
    
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.code] = row.value;
    }
    
    return map;
  }

  /**
   * Get configuration by code without filtering (for system use only)
   * Used by internal systems like settings that need access to actual values
   */
  async getByCodeSystem(code: string): Promise<Configuration | null> {
    return this.getByCode(code);
  }
}

// Singleton instance
export const configurationService = new ConfigurationService();