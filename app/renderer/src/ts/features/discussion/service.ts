import type {
  Discussion,
  Message,
  DiscussionWithMessages,
  DiscussionFilters,
  MessageFilters,
  CreateDiscussionPayload,
  UpdateDiscussionPayload,
  CreateMessagePayload,
} from './types';
import { isElectronEnvironment } from '@features/environment';
import * as electronService from './electron-service';
import * as browserService from './browser-service';

class DiscussionService {
  private get service() {
    return isElectronEnvironment() ? electronService : browserService;
  }

  // Discussion operations
  async listDiscussions(filters?: DiscussionFilters): Promise<Discussion[]> {
    try {
      return await this.service.listDiscussions(filters);
    } catch (error) {
      console.error('Failed to list discussions:', error);
      throw error;
    }
  }

  async createDiscussion(payload: CreateDiscussionPayload): Promise<Discussion> {
    try {
      return await this.service.createDiscussion(payload);
    } catch (error) {
      console.error('Failed to create discussion:', error);
      throw error;
    }
  }

  async updateDiscussion(payload: UpdateDiscussionPayload): Promise<Discussion> {
    try {
      return await this.service.updateDiscussion(payload);
    } catch (error) {
      console.error('Failed to update discussion:', error);
      throw error;
    }
  }

  async deleteDiscussion(id: number): Promise<void> {
    try {
      await this.service.deleteDiscussion(id);
    } catch (error) {
      console.error('Failed to delete discussion:', error);
      throw error;
    }
  }

  async getDiscussionWithMessages(discussionId: number): Promise<DiscussionWithMessages | null> {
    try {
      return await this.service.getDiscussionWithMessages(discussionId);
    } catch (error) {
      console.error('Failed to get discussion with messages:', error);
      throw error;
    }
  }

  async toggleFavorite(discussionId: number): Promise<Discussion> {
    try {
      return await this.service.toggleFavorite(discussionId);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  }

  // Message operations
  async listMessages(filters?: MessageFilters): Promise<Message[]> {
    try {
      return await this.service.listMessages(filters);
    } catch (error) {
      console.error('Failed to list messages:', error);
      throw error;
    }
  }

  async createMessage(payload: CreateMessagePayload): Promise<Message> {
    try {
      return await this.service.createMessage(payload);
    } catch (error) {
      console.error('Failed to create message:', error);
      throw error;
    }
  }

  async getMessagesByDiscussion(discussionId: number): Promise<Message[]> {
    try {
      return await this.service.getMessagesByDiscussion(discussionId);
    } catch (error) {
      console.error('Failed to get messages by discussion:', error);
      throw error;
    }
  }

  async getLastMessages(discussionId: number, limit?: number): Promise<Message[]> {
    try {
      return await this.service.getLastMessages(discussionId, limit);
    } catch (error) {
      console.error('Failed to get last messages:', error);
      throw error;
    }
  }

  async countMessages(discussionId: number): Promise<number> {
    try {
      return await this.service.countMessages(discussionId);
    } catch (error) {
      console.error('Failed to count messages:', error);
      throw error;
    }
  }

  async deleteMessagesByDiscussion(discussionId: number): Promise<void> {
    try {
      await this.service.deleteMessagesByDiscussion(discussionId);
    } catch (error) {
      console.error('Failed to delete messages by discussion:', error);
      throw error;
    }
  }

  // Helper methods
  async createNewDiscussionWithAgent(agentId: number, title?: string): Promise<DiscussionWithMessages> {
    try {
      // Create a new discussion
      const discussion = await this.createDiscussion({
        agentId,
        title: title || 'New Discussion',
        isFavorite: false,
      });

      // Return it as a DiscussionWithMessages with empty messages
      return {
        ...discussion,
        messages: [],
      };
    } catch (error) {
      console.error('Failed to create new discussion with agent:', error);
      throw error;
    }
  }

  /**
   * Build conversation history for AI with memory
   */
  buildConversationHistory(messages: Message[]): string {
    if (!messages || messages.length === 0) {
      return '';
    }

    const history = messages
      .map(msg => {
        const role = msg.who === 'user' ? 'User' : 'AI Agent';
        return `## ${role}\n${msg.content}`;
      })
      .join('\n\n');

    return `<conversation_history>\n${history}\n</conversation_history>`;
  }

  /**
   * Format messages for AI communication
   */
  formatMessagesForAI(messages: Message[], newUserMessage?: string): any[] {
    const formattedMessages: any[] = [];

    // Add conversation history if there are previous messages
    if (messages && messages.length > 0) {
      const history = this.buildConversationHistory(messages);
      if (history) {
        formattedMessages.push({
          role: 'system',
          content: history,
        });
      }
    }

    // Add new user message if provided
    if (newUserMessage) {
      formattedMessages.push({
        role: 'user',
        content: newUserMessage,
      });
    }

    return formattedMessages;
  }
}

export const discussionService = new DiscussionService();