import { eq } from 'drizzle-orm';
import { aiAgents, aiModels, aiProviders } from '../../../../packages/db/src/db/schema.js';
import { BaseService } from './base-service.js';
import type { AgentFilters, AgentInsert, AgentUpdate } from '../types.js';

/**
 * Service for AI agents operations
 * Extends BaseService with agent-specific logic including model and provider joins
 */
export class AgentService extends BaseService<any, AgentFilters, AgentInsert, AgentUpdate> {
  protected tableName = 'ai_agents';
  protected table = aiAgents;

  /**
   * Build where clauses for agent filtering
   */
  protected buildWhereClause(filters: AgentFilters): any[] {
    const clauses = [
      this.buildLikeClause(aiAgents.code, filters.code),
      this.buildLikeClause(aiAgents.name, filters.name),
      this.buildLikeClause(aiAgents.version, filters.version),
    ];
    
    return this.filterClauses(clauses);
  }

  /**
   * Prepare insert data with timestamps and defaults
   */
  protected prepareInsertData(payload: AgentInsert): any {
    const now = new Date();
    return {
      code: payload.code,
      name: payload.name,
      description: payload.description ?? '',
      version: payload.version ?? '1.0',
      enable: payload.enable ?? true,
      isSystem: payload.isSystem ?? false,
      systemPrompt: payload.systemPrompt ?? null,
      configuration: payload.configuration ?? '{}',
      modelId: payload.modelId,
      createdAt: now,
      updatedAt: now,
    } as const;
  }

  /**
   * Prepare update data with updated timestamp
   */
  protected prepareUpdateData(payload: AgentUpdate): any {
    const { id, ...updates } = payload;
    return {
      ...updates,
      updatedAt: new Date(),
    };
  }

  /**
   * List agents with model and provider information and ordering by name
   */
  async list(filters?: AgentFilters): Promise<any[]> {
    const orm = await this.getOrm();
    const f = filters ?? {} as AgentFilters;
    const whereClauses = this.buildWhereClause(f);

    const rows = await orm
      .select({
        id: aiAgents.id,
        code: aiAgents.code,
        name: aiAgents.name,
        description: aiAgents.description,
        version: aiAgents.version,
        enable: aiAgents.enable,
        isSystem: aiAgents.isSystem,
        systemPrompt: aiAgents.systemPrompt,
        configuration: aiAgents.configuration,
        modelId: aiAgents.modelId,
        createdAt: aiAgents.createdAt,
        updatedAt: aiAgents.updatedAt,
        model: {
          id: aiModels.id,
          name: aiModels.name,
          code: aiModels.code,
        },
        provider: {
          id: aiProviders.id,
          name: aiProviders.name,
          code: aiProviders.code,
        },
      })
      .from(aiAgents)
      .leftJoin(aiModels, eq(aiAgents.modelId, aiModels.id))
      .leftJoin(aiProviders, eq(aiModels.providerId, aiProviders.id))
      .where(whereClauses.length ? this.buildAndClause(...whereClauses) : undefined)
      .orderBy(aiAgents.name);
    
    return rows;
  }
}

// Singleton instance
export const agentService = new AgentService();