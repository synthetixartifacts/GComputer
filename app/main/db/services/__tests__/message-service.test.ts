import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { MessageFilters, MessageInsert } from '../message-service';

// Mock modules that message-service depends on
vi.mock('node:fs');
vi.mock('node:path', () => ({
  default: {
    resolve: vi.fn((p) => p),
    join: vi.fn((...parts) => parts.join('/')),
  },
}));

vi.mock('../../../../../packages/db/src/db/client.js', () => ({
  getOrm: vi.fn(),
  saveDatabase: vi.fn(),
}));

vi.mock('../../../../../packages/db/src/db/schema.js', () => ({
  messages: {},
  discussions: {},
}));

// Import after mocks are set up
import { messageService } from '../message-service';
import { getOrm } from '../../../../../packages/db/src/db/client.js';

describe('MessageService', () => {
  let mockOrm: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockOrm = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    };

    (getOrm as any).mockResolvedValue(mockOrm);
  });

  describe('list', () => {
    it('should list messages', async () => {
      const mockMessages = [
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

      mockOrm.where.mockResolvedValue(mockMessages);

      const result = await messageService.list();

      expect(result).toEqual(mockMessages);
      expect(mockOrm.select).toHaveBeenCalled();
      expect(mockOrm.from).toHaveBeenCalled();
    });

    it('should filter messages by discussionId', async () => {
      const filters: MessageFilters = { discussionId: 1 };
      mockOrm.where.mockResolvedValue([]);

      await messageService.list(filters);

      expect(mockOrm.where).toHaveBeenCalled();
    });

    it('should filter messages by who', async () => {
      const filters: MessageFilters = { who: 'user' };
      mockOrm.where.mockResolvedValue([]);

      await messageService.list(filters);

      expect(mockOrm.where).toHaveBeenCalled();
    });
  });

  describe('createForDiscussion', () => {
    it('should create a message and update discussion timestamp', async () => {
      const payload: MessageInsert = {
        who: 'user',
        content: 'Test message',
        discussionId: 1,
      };

      const mockCreated = {
        id: 1,
        ...payload,
        createdAt: new Date(),
      };

      mockOrm.returning.mockResolvedValueOnce([mockCreated]);
      mockOrm.where.mockResolvedValue(undefined);

      const result = await messageService.createForDiscussion(payload);

      expect(result).toEqual(mockCreated);
      expect(mockOrm.insert).toHaveBeenCalled();
      expect(mockOrm.values).toHaveBeenCalled();
      
      // Should also update discussion
      expect(mockOrm.update).toHaveBeenCalled();
      expect(mockOrm.set).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedAt: expect.any(Date),
        })
      );
    });

    it('should return null if message creation fails', async () => {
      const payload: MessageInsert = {
        who: 'user',
        content: 'Test message',
        discussionId: 1,
      };

      mockOrm.returning.mockResolvedValueOnce([]);

      const result = await messageService.createForDiscussion(payload);

      expect(result).toBeNull();
      // Should not update discussion if message creation fails
      expect(mockOrm.update).not.toHaveBeenCalled();
    });
  });

  describe('getByDiscussion', () => {
    it('should get all messages for a discussion', async () => {
      const discussionId = 1;
      const mockMessages = [
        {
          id: 1,
          who: 'user',
          content: 'Hello',
          discussionId: 1,
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 2,
          who: 'agent',
          content: 'Hi there!',
          discussionId: 1,
          createdAt: new Date('2024-01-02'),
        },
      ];

      mockOrm.orderBy.mockResolvedValue(mockMessages);

      const result = await messageService.getByDiscussion(discussionId);

      expect(result).toEqual(mockMessages);
      expect(mockOrm.where).toHaveBeenCalled();
      expect(mockOrm.orderBy).toHaveBeenCalled();
    });
  });

  describe('getLastMessages', () => {
    it('should get last N messages from a discussion', async () => {
      const discussionId = 1;
      const limit = 5;
      const mockMessages = [
        {
          id: 3,
          who: 'user',
          content: 'Message 3',
          discussionId: 1,
          createdAt: new Date(),
        },
        {
          id: 2,
          who: 'agent',
          content: 'Message 2',
          discussionId: 1,
          createdAt: new Date(),
        },
        {
          id: 1,
          who: 'user',
          content: 'Message 1',
          discussionId: 1,
          createdAt: new Date(),
        },
      ];

      mockOrm.limit.mockResolvedValue(mockMessages);

      const result = await messageService.getLastMessages(discussionId, limit);

      // Should be reversed to chronological order
      expect(result).toEqual(mockMessages.reverse());
      expect(mockOrm.where).toHaveBeenCalled();
      expect(mockOrm.orderBy).toHaveBeenCalled();
      expect(mockOrm.limit).toHaveBeenCalledWith(limit);
    });

    it('should use default limit of 10', async () => {
      const discussionId = 1;
      mockOrm.limit.mockResolvedValue([]);

      await messageService.getLastMessages(discussionId);

      expect(mockOrm.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('countByDiscussion', () => {
    it('should count messages in a discussion', async () => {
      const discussionId = 1;
      mockOrm.where.mockResolvedValue([{ count: 5 }]);

      const result = await messageService.countByDiscussion(discussionId);

      expect(result).toBe(5);
      expect(mockOrm.select).toHaveBeenCalledWith({ count: expect.anything() });
      expect(mockOrm.where).toHaveBeenCalled();
    });

    it('should return 0 if no messages', async () => {
      const discussionId = 1;
      mockOrm.where.mockResolvedValue([]);

      const result = await messageService.countByDiscussion(discussionId);

      expect(result).toBe(0);
    });
  });

  describe('deleteByDiscussion', () => {
    it('should delete all messages for a discussion', async () => {
      const discussionId = 1;
      mockOrm.where.mockResolvedValue(undefined);

      await messageService.deleteByDiscussion(discussionId);

      expect(mockOrm.delete).toHaveBeenCalled();
      expect(mockOrm.where).toHaveBeenCalled();
    });
  });
});