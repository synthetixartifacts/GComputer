import { eq, desc, and } from 'drizzle-orm';
import { BaseService } from './base-service.js';
import { discussions, aiAgents, messages } from '../../../../packages/db/src/db/schema.js';
import type { DbResult } from '../types.js';

export interface Discussion {
  id: number;
  title: string;
  isFavorite: boolean;
  agentId: number;
  agent?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscussionFilters {
  isFavorite?: boolean;
  agentId?: number;
  search?: string;
}

export interface DiscussionInsert {
  title?: string;
  isFavorite?: boolean;
  agentId: number;
}

export interface DiscussionUpdate {
  id: number;
  title?: string;
  isFavorite?: boolean;
  agentId?: number;
}

export interface DiscussionWithMessages extends Discussion {
  messages: any[];
}

class DiscussionService extends BaseService<Discussion, DiscussionFilters, DiscussionInsert, DiscussionUpdate> {
  protected tableName = 'discussions';
  protected table = discussions;

  protected buildWhereClause(filters: DiscussionFilters): any[] {
    const clauses = this.filterClauses([
      this.buildEqualClause(discussions.isFavorite, filters.isFavorite),
      this.buildEqualClause(discussions.agentId, filters.agentId),
      this.buildLikeClause(discussions.title, filters.search),
    ]);
    return clauses;
  }

  protected prepareInsertData(payload: DiscussionInsert): any {
    const now = new Date();
    return {
      title: payload.title || 'New Discussion',
      isFavorite: payload.isFavorite || false,
      agentId: payload.agentId,
      createdAt: now,
      updatedAt: now,
    };
  }

  protected prepareUpdateData(payload: DiscussionUpdate): any {
    const { id, ...updates } = payload;
    return {
      ...updates,
      updatedAt: new Date(),
    };
  }

  /**
   * List discussions with agent information
   */
  async list(filters?: DiscussionFilters): Promise<Discussion[]> {
    const orm = await this.getOrm();
    const f = filters ?? {} as DiscussionFilters;
    const whereClauses = this.buildWhereClause(f);

    const rows = await orm
      .select({
        id: discussions.id,
        title: discussions.title,
        isFavorite: discussions.isFavorite,
        agentId: discussions.agentId,
        createdAt: discussions.createdAt,
        updatedAt: discussions.updatedAt,
        agent: {
          id: aiAgents.id,
          name: aiAgents.name,
          code: aiAgents.code,
          description: aiAgents.description,
        },
      })
      .from(discussions)
      .leftJoin(aiAgents, eq(discussions.agentId, aiAgents.id))
      .where(whereClauses.length ? and(...whereClauses) : undefined)
      .orderBy(desc(discussions.isFavorite), desc(discussions.updatedAt));
    
    return rows;
  }

  /**
   * Get a discussion with all its messages
   */
  async getWithMessages(discussionId: number): Promise<DiscussionWithMessages | null> {
    const orm = await this.getOrm();
    
    // Get discussion with agent info
    const discussionRows = await orm
      .select({
        id: discussions.id,
        title: discussions.title,
        isFavorite: discussions.isFavorite,
        agentId: discussions.agentId,
        createdAt: discussions.createdAt,
        updatedAt: discussions.updatedAt,
        agent: {
          id: aiAgents.id,
          name: aiAgents.name,
          code: aiAgents.code,
          description: aiAgents.description,
          systemPrompt: aiAgents.systemPrompt,
          configuration: aiAgents.configuration,
          modelId: aiAgents.modelId,
        },
      })
      .from(discussions)
      .leftJoin(aiAgents, eq(discussions.agentId, aiAgents.id))
      .where(eq(discussions.id, discussionId));
    
    if (!discussionRows.length) {
      return null;
    }

    const discussion = discussionRows[0];
    
    // Get all messages for this discussion
    const messageRows = await orm
      .select()
      .from(messages)
      .where(eq(messages.discussionId, discussionId))
      .orderBy(messages.createdAt);
    
    return {
      ...discussion,
      messages: messageRows,
    };
  }

  /**
   * Toggle favorite status for a discussion
   */
  async toggleFavorite(discussionId: number): Promise<Discussion | null> {
    const orm = await this.getOrm();
    
    // Get current favorite status
    const current = await orm
      .select({ isFavorite: discussions.isFavorite })
      .from(discussions)
      .where(eq(discussions.id, discussionId));
    
    if (!current.length) {
      return null;
    }

    // Check if discussion has at least one message
    const messageCount = await orm
      .select({ count: messages.id })
      .from(messages)
      .where(eq(messages.discussionId, discussionId));
    
    if (!messageCount.length || !messageCount[0].count) {
      throw new Error('Cannot favorite a discussion without messages');
    }

    // Toggle the favorite status
    return this.update({
      id: discussionId,
      isFavorite: !current[0].isFavorite,
    });
  }

  /**
   * Delete a discussion and all its messages (cascade delete)
   */
  async delete(id: number): Promise<DbResult> {
    const orm = await this.getOrm();
    
    // Messages will be deleted automatically due to cascade
    await orm.delete(discussions).where(eq(discussions.id, id));
    
    const { saveDatabase } = await import('../../../../packages/db/src/db/client.js');
    saveDatabase();
    
    return { ok: true } as const;
  }
}

export const discussionService = new DiscussionService();