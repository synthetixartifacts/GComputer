import { and, like, eq } from 'drizzle-orm';
import { getOrm, saveDatabase } from '../../../../packages/db/src/db/client.js';
import type { DbResult } from '../types.js';

/**
 * Abstract base service class providing common CRUD operations
 * Implements DRY principle by centralizing database patterns
 */
export abstract class BaseService<TEntity, TFilters, TInsert, TUpdate> {
  protected abstract tableName: string;
  protected abstract table: any;
  
  /**
   * Build where clauses for filtering - must be implemented by subclasses
   */
  protected abstract buildWhereClause(filters: TFilters): any[];

  /**
   * Transform insert payload - can be overridden for custom logic
   */
  protected prepareInsertData(payload: TInsert): any {
    return payload;
  }

  /**
   * Transform update payload - can be overridden for custom logic
   */
  protected prepareUpdateData(payload: TUpdate): any {
    const { id, ...updates } = payload as any;
    return updates;
  }

  /**
   * List entities with optional filtering
   * Can be overridden by subclasses for custom select logic
   */
  async list(filters?: TFilters): Promise<TEntity[]> {
    const orm = await getOrm();
    const f = filters ?? {} as TFilters;
    const whereClauses = this.buildWhereClause(f);

    const rows = await orm
      .select()
      .from(this.table)
      .where(whereClauses.length ? and(...whereClauses) : undefined);
    
    return rows;
  }

  /**
   * Helper to get ORM instance - accessible to subclasses
   */
  protected async getOrm() {
    return getOrm();
  }

  /**
   * Helper to build AND clause - accessible to subclasses
   */
  protected buildAndClause(...clauses: any[]) {
    return and(...clauses);
  }

  /**
   * Insert a new entity
   */
  async insert(payload: TInsert): Promise<TEntity | null> {
    const orm = await getOrm();
    const values = this.prepareInsertData(payload);
    
    const res = await orm.insert(this.table).values(values).returning();
    saveDatabase();
    return res[0] ?? null;
  }

  /**
   * Create a new entity (alias for insert for consistency)
   */
  async create(payload: TInsert): Promise<TEntity | null> {
    return this.insert(payload);
  }

  /**
   * Update an existing entity
   */
  async update(payload: TUpdate): Promise<TEntity | null> {
    const orm = await getOrm();
    const { id } = payload as any;
    const updates = this.prepareUpdateData(payload);
    
    const res = await orm
      .update(this.table)
      .set(updates)
      .where(eq(this.table.id, id))
      .returning();
    
    saveDatabase();
    return res[0] ?? null;
  }

  /**
   * Delete an entity by ID
   */
  async delete(id: number): Promise<DbResult> {
    const orm = await getOrm();
    await orm.delete(this.table).where(eq(this.table.id, id));
    saveDatabase();
    return { ok: true } as const;
  }

  /**
   * Truncate the entire table (use with caution)
   */
  async truncate(): Promise<DbResult> {
    const orm = await getOrm();
    await orm.delete(this.table);
    saveDatabase();
    return { ok: true } as const;
  }

  /**
   * Helper to build equal clause for exact matching
   */
  protected buildEqualClause(column: any, value?: any): any | undefined {
    if (value !== undefined && value !== null) {
      return eq(column, value);
    }
    return undefined;
  }

  /**
   * Helper to build LIKE clause for text filtering
   */
  protected buildLikeClause(column: any, value?: string): any | undefined {
    if (value && value.trim() !== '') {
      return like(column, `%${value}%`);
    }
    return undefined;
  }

  /**
   * Helper to filter out null/undefined clauses
   */
  protected filterClauses(clauses: (any | null | undefined)[]): any[] {
    return clauses.filter(clause => clause !== null && clause !== undefined);
  }

  /**
   * Helper to combine multiple where clauses with AND
   */
  protected combineWhereClauses(clauses: any[]): any | undefined {
    const filtered = this.filterClauses(clauses);
    if (filtered.length === 0) return undefined;
    if (filtered.length === 1) return filtered[0];
    return and(...filtered);
  }
}