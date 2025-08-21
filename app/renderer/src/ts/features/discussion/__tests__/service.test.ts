import { describe, it, expect, beforeEach, vi } from 'vitest';
import { discussionService } from '../service';
import type {
  Discussion,
  Message,
  DiscussionFilters,
  CreateDiscussionPayload,
  UpdateDiscussionPayload,
  CreateMessagePayload,
} from '../types';

// Mock window.gc.db
const mockDb = {
  discussions: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getWithMessages: vi.fn(),
    toggleFavorite: vi.fn(),
  },
  messages: {
    list: vi.fn(),
    create: vi.fn(),
    getByDiscussion: vi.fn(),
    getLastMessages: vi.fn(),
    countByDiscussion: vi.fn(),
    deleteByDiscussion: vi.fn(),
  },
};

// @ts-ignore
global.window = {
  gc: {
    db: mockDb,
  },
};

describe('DiscussionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Discussion Operations', () => {
    it('should list discussions', async () => {
      const mockDiscussions: Discussion[] = [
        {
          id: 1,
          title: 'Test Discussion',
          isFavorite: false,
          agentId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDb.discussions.list.mockResolvedValue(mockDiscussions);

      const result = await discussionService.listDiscussions();

      expect(result).toEqual(mockDiscussions);
      expect(mockDb.discussions.list).toHaveBeenCalledWith(undefined);
    });

    it('should list discussions with filters', async () => {
      const filters: DiscussionFilters = { isFavorite: true };
      mockDb.discussions.list.mockResolvedValue([]);

      await discussionService.listDiscussions(filters);

      expect(mockDb.discussions.list).toHaveBeenCalledWith(filters);
    });

    it('should create a discussion', async () => {
      const payload: CreateDiscussionPayload = {
        title: 'New Discussion',
        agentId: 1,
      };

      const mockCreated: Discussion = {
        id: 1,
        ...payload,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.discussions.create.mockResolvedValue(mockCreated);

      const result = await discussionService.createDiscussion(payload);

      expect(result).toEqual(mockCreated);
      expect(mockDb.discussions.create).toHaveBeenCalledWith(payload);
    });

    it('should throw error if discussion creation fails', async () => {
      const payload: CreateDiscussionPayload = { agentId: 1 };
      mockDb.discussions.create.mockResolvedValue(null);

      await expect(discussionService.createDiscussion(payload)).rejects.toThrow(
        'Failed to create discussion'
      );
    });

    it('should update a discussion', async () => {
      const payload: UpdateDiscussionPayload = {
        id: 1,
        title: 'Updated Title',
      };

      const mockUpdated: Discussion = {
        id: 1,
        title: 'Updated Title',
        isFavorite: false,
        agentId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.discussions.update.mockResolvedValue(mockUpdated);

      const result = await discussionService.updateDiscussion(payload);

      expect(result).toEqual(mockUpdated);
      expect(mockDb.discussions.update).toHaveBeenCalledWith(payload);
    });

    it('should delete a discussion', async () => {
      mockDb.discussions.delete.mockResolvedValue({ ok: true });

      await discussionService.deleteDiscussion(1);

      expect(mockDb.discussions.delete).toHaveBeenCalledWith(1);
    });

    it('should get discussion with messages', async () => {
      const mockDiscussionWithMessages = {
        id: 1,
        title: 'Test',
        isFavorite: false,
        agentId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
      };

      mockDb.discussions.getWithMessages.mockResolvedValue(mockDiscussionWithMessages);

      const result = await discussionService.getDiscussionWithMessages(1);

      expect(result).toEqual(mockDiscussionWithMessages);
      expect(mockDb.discussions.getWithMessages).toHaveBeenCalledWith(1);
    });

    it('should toggle favorite', async () => {
      const mockUpdated: Discussion = {
        id: 1,
        title: 'Test',
        isFavorite: true,
        agentId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.discussions.toggleFavorite.mockResolvedValue(mockUpdated);

      const result = await discussionService.toggleFavorite(1);

      expect(result).toEqual(mockUpdated);
      expect(mockDb.discussions.toggleFavorite).toHaveBeenCalledWith(1);
    });
  });

  describe('Message Operations', () => {
    it('should list messages', async () => {
      const mockMessages: Message[] = [
        {
          id: 1,
          who: 'user',
          content: 'Hello',
          discussionId: 1,
          createdAt: new Date(),
        },
      ];

      mockDb.messages.list.mockResolvedValue(mockMessages);

      const result = await discussionService.listMessages();

      expect(result).toEqual(mockMessages);
      expect(mockDb.messages.list).toHaveBeenCalledWith(undefined);
    });

    it('should create a message', async () => {
      const payload: CreateMessagePayload = {
        who: 'user',
        content: 'Test message',
        discussionId: 1,
      };

      const mockCreated: Message = {
        id: 1,
        ...payload,
        createdAt: new Date(),
      };

      mockDb.messages.create.mockResolvedValue(mockCreated);

      const result = await discussionService.createMessage(payload);

      expect(result).toEqual(mockCreated);
      expect(mockDb.messages.create).toHaveBeenCalledWith(payload);
    });

    it('should get messages by discussion', async () => {
      const mockMessages: Message[] = [];
      mockDb.messages.getByDiscussion.mockResolvedValue(mockMessages);

      const result = await discussionService.getMessagesByDiscussion(1);

      expect(result).toEqual(mockMessages);
      expect(mockDb.messages.getByDiscussion).toHaveBeenCalledWith(1);
    });

    it('should get last messages', async () => {
      const mockMessages: Message[] = [];
      mockDb.messages.getLastMessages.mockResolvedValue(mockMessages);

      const result = await discussionService.getLastMessages(1, 5);

      expect(result).toEqual(mockMessages);
      expect(mockDb.messages.getLastMessages).toHaveBeenCalledWith(1, 5);
    });

    it('should count messages', async () => {
      mockDb.messages.countByDiscussion.mockResolvedValue(10);

      const result = await discussionService.countMessages(1);

      expect(result).toBe(10);
      expect(mockDb.messages.countByDiscussion).toHaveBeenCalledWith(1);
    });

    it('should delete messages by discussion', async () => {
      mockDb.messages.deleteByDiscussion.mockResolvedValue({ ok: true });

      await discussionService.deleteMessagesByDiscussion(1);

      expect(mockDb.messages.deleteByDiscussion).toHaveBeenCalledWith(1);
    });
  });

  describe('Helper Methods', () => {
    it('should create new discussion with agent', async () => {
      const mockDiscussion: Discussion = {
        id: 1,
        title: 'New Discussion',
        isFavorite: false,
        agentId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.discussions.create.mockResolvedValue(mockDiscussion);

      const result = await discussionService.createNewDiscussionWithAgent(1, 'Custom Title');

      expect(result).toEqual({
        ...mockDiscussion,
        messages: [],
      });
      expect(mockDb.discussions.create).toHaveBeenCalledWith({
        agentId: 1,
        title: 'Custom Title',
        isFavorite: false,
      });
    });

    it('should build conversation history', () => {
      const messages: Message[] = [
        {
          id: 1,
          who: 'user',
          content: 'Hello',
          discussionId: 1,
          createdAt: new Date(),
        },
        {
          id: 2,
          who: 'agent',
          content: 'Hi there!',
          discussionId: 1,
          createdAt: new Date(),
        },
      ];

      const history = discussionService.buildConversationHistory(messages);

      expect(history).toContain('<conversation_history>');
      expect(history).toContain('## User\nHello');
      expect(history).toContain('## AI Agent\nHi there!');
      expect(history).toContain('</conversation_history>');
    });

    it('should return empty string for empty conversation history', () => {
      const history = discussionService.buildConversationHistory([]);

      expect(history).toBe('');
    });

    it('should format messages for AI', () => {
      const messages: Message[] = [
        {
          id: 1,
          who: 'user',
          content: 'Previous message',
          discussionId: 1,
          createdAt: new Date(),
        },
      ];

      const formatted = discussionService.formatMessagesForAI(messages, 'New message');

      expect(formatted).toHaveLength(2);
      expect(formatted[0].role).toBe('system');
      expect(formatted[0].content).toContain('<conversation_history>');
      expect(formatted[1].role).toBe('user');
      expect(formatted[1].content).toBe('New message');
    });

    it('should format messages without history', () => {
      const formatted = discussionService.formatMessagesForAI([], 'New message');

      expect(formatted).toHaveLength(1);
      expect(formatted[0].role).toBe('user');
      expect(formatted[0].content).toBe('New message');
    });
  });
});