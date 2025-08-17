import { eq } from 'drizzle-orm';
import { aiModels, aiProviders } from '../../../../packages/db/src/db/schema.js';
import { BaseService } from './base-service.js';
import type { ModelFilters, ModelInsert, ModelUpdate } from '../types.js';

/**
 * Service for AI models operations
 * Extends BaseService with model-specific logic including provider joins
 */
export class ModelService extends BaseService<any, ModelFilters, ModelInsert, ModelUpdate> {
  protected tableName = 'ai_models';
  protected table = aiModels;

  /**
   * Build where clauses for model filtering
   */
  protected buildWhereClause(filters: ModelFilters): any[] {
    const clauses = [
      this.buildLikeClause(aiModels.code, filters.code),
      this.buildLikeClause(aiModels.name, filters.name),
      this.buildLikeClause(aiModels.model, filters.model),
    ];
    
    return this.filterClauses(clauses);
  }

  /**
   * Prepare insert data with timestamps and defaults
   */
  protected prepareInsertData(payload: ModelInsert): any {
    const now = new Date();
    return {
      code: payload.code,
      name: payload.name,
      model: payload.model,
      inputPrice: payload.inputPrice ?? null,
      outputPrice: payload.outputPrice ?? null,
      endpoint: payload.endpoint,
      params: payload.params ?? '{}',
      messageLocation: payload.messageLocation ?? null,
      streamMessageLocation: payload.streamMessageLocation ?? null,
      inputTokenCountLocation: payload.inputTokenCountLocation ?? null,
      outputTokenCountLocation: payload.outputTokenCountLocation ?? null,
      providerId: payload.providerId,
      createdAt: now,
      updatedAt: now,
    } as const;
  }

  /**
   * Prepare update data with updated timestamp
   */
  protected prepareUpdateData(payload: ModelUpdate): any {
    const { id, ...updates } = payload;
    return {
      ...updates,
      updatedAt: new Date(),
    };
  }

  /**
   * List models with provider information and ordering by name
   */
  async list(filters?: ModelFilters): Promise<any[]> {
    const orm = await this.getOrm();
    const f = filters ?? {} as ModelFilters;
    const whereClauses = this.buildWhereClause(f);

    const rows = await orm
      .select({
        id: aiModels.id,
        code: aiModels.code,
        name: aiModels.name,
        model: aiModels.model,
        inputPrice: aiModels.inputPrice,
        outputPrice: aiModels.outputPrice,
        endpoint: aiModels.endpoint,
        params: aiModels.params,
        messageLocation: aiModels.messageLocation,
        streamMessageLocation: aiModels.streamMessageLocation,
        inputTokenCountLocation: aiModels.inputTokenCountLocation,
        outputTokenCountLocation: aiModels.outputTokenCountLocation,
        providerId: aiModels.providerId,
        createdAt: aiModels.createdAt,
        updatedAt: aiModels.updatedAt,
        provider: {
          id: aiProviders.id,
          name: aiProviders.name,
          code: aiProviders.code,
        },
      })
      .from(aiModels)
      .leftJoin(aiProviders, eq(aiModels.providerId, aiProviders.id))
      .where(whereClauses.length ? this.buildAndClause(...whereClauses) : undefined)
      .orderBy(aiModels.name);
    
    return rows;
  }
}

// Singleton instance
export const modelService = new ModelService();