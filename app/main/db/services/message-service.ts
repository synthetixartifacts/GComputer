import { eq, and, or, desc } from 'drizzle-orm';
import { BaseService } from './base-service.js';
import { messages, discussions } from '../../../../packages/db/src/db/schema.js';

export interface Message {
  id: number;
  who: 'user' | 'agent';
  content: string;
  discussionId: number;
  createdAt: Date;
}

export interface MessageFilters {
  discussionId?: number;
  who?: 'user' | 'agent';
}

export interface MessageInsert {
  who: 'user' | 'agent';
  content: string;
  discussionId: number;
}

export interface MessageUpdate {
  id: number;
  content?: string;
}

class MessageService extends BaseService<Message, MessageFilters, MessageInsert, MessageUpdate> {
  protected tableName = 'messages';
  protected table = messages;

  protected buildWhereClause(filters: MessageFilters): any[] {
    const clauses = this.filterClauses([
      this.buildEqualClause(messages.discussionId, filters.discussionId),
      this.buildEqualClause(messages.who, filters.who),
    ]);
    return clauses;
  }

  protected prepareInsertData(payload: MessageInsert): any {
    return {
      who: payload.who,
      content: payload.content,
      discussionId: payload.discussionId,
      createdAt: new Date(),
    };
  }

  /**
   * Get all messages for a specific discussion
   */
  async getByDiscussion(discussionId: number): Promise<Message[]> {
    const orm = await this.getOrm();
    
    const rows = await orm
      .select()
      .from(messages)
      .where(eq(messages.discussionId, discussionId))
      .orderBy(messages.createdAt);
    
    return rows;
  }

  /**
   * Create a message and update the discussion's updatedAt timestamp
   */
  async createForDiscussion(payload: MessageInsert): Promise<Message | null> {
    const orm = await this.getOrm();
    
    // Create the message
    const message = await this.insert(payload);
    
    if (message) {
      // Update the discussion's updatedAt timestamp
      await orm
        .update(discussions)
        .set({ updatedAt: new Date() })
        .where(eq(discussions.id, payload.discussionId));
      
      const { saveDatabase } = await import('../../../../packages/db/src/db/client.js');
      saveDatabase();
    }
    
    return message;
  }

  /**
   * Get the last N messages from a discussion
   */
  async getLastMessages(discussionId: number, limit: number = 10): Promise<Message[]> {
    const orm = await this.getOrm();
    
    const rows = await orm
      .select()
      .from(messages)
      .where(eq(messages.discussionId, discussionId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    
    // Reverse to get chronological order
    return rows.reverse();
  }

  /**
   * Count messages in a discussion
   */
  async countByDiscussion(discussionId: number): Promise<number> {
    const orm = await this.getOrm();
    
    const result = await orm
      .select({ count: messages.id })
      .from(messages)
      .where(eq(messages.discussionId, discussionId));
    
    return result[0]?.count || 0;
  }

  /**
   * Delete all messages for a discussion
   */
  async deleteByDiscussion(discussionId: number): Promise<void> {
    const orm = await this.getOrm();
    
    await orm
      .delete(messages)
      .where(eq(messages.discussionId, discussionId));
    
    const { saveDatabase } = await import('../../../../packages/db/src/db/client.js');
    saveDatabase();
  }
}

export const messageService = new MessageService();