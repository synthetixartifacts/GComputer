import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DiscussionFilters, DiscussionInsert, DiscussionUpdate } from '../discussion-service';

// Mock modules that discussion-service depends on
vi.mock('node:fs');
vi.mock('node:path', () => ({
  default: {
    resolve: vi.fn((p) => p),
    join: vi.fn((...parts) => parts.join('/')),
  },
}));

vi.mock('../../../../packages/db/src/db/client.js', () => ({
  getOrm: vi.fn(),
  saveDatabase: vi.fn(),
}));

vi.mock('../../../../packages/db/src/db/schema.js', () => ({
  discussions: {},
  aiAgents: {},
  messages: {},
}));

// Import after mocks are set up
import { discussionService } from '../discussion-service';

describe('DiscussionService', () => {
  let mockOrm: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockOrm = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };

    const { getOrm } = await import('../../../../packages/db/src/db/client.js');
    getOrm.mockResolvedValue(mockOrm);
  });

  describe('list', () => {
    it('should list discussions with agent information', async () => {
      const mockDiscussions = [
        {
          id: 1,
          title: 'Test Discussion',
          isFavorite: false,
          agentId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          agent: {
            id: 1,
            name: 'Test Agent',
            code: 'test-agent',
            description: 'Test description',
          },
        },
      ];

      mockOrm.orderBy.mockResolvedValue(mockDiscussions);

      const result = await discussionService.list();

      expect(result).toEqual(mockDiscussions);
      expect(mockOrm.select).toHaveBeenCalled();
      expect(mockOrm.leftJoin).toHaveBeenCalled();
      expect(mockOrm.orderBy).toHaveBeenCalled();
    });

    it('should filter discussions by isFavorite', async () => {
      const filters: DiscussionFilters = { isFavorite: true };
      mockOrm.orderBy.mockResolvedValue([]);

      await discussionService.list(filters);

      expect(mockOrm.where).toHaveBeenCalled();
    });

    it('should filter discussions by agentId', async () => {
      const filters: DiscussionFilters = { agentId: 1 };
      mockOrm.orderBy.mockResolvedValue([]);

      await discussionService.list(filters);

      expect(mockOrm.where).toHaveBeenCalled();
    });

    it('should filter discussions by search term', async () => {
      const filters: DiscussionFilters = { search: 'test' };
      mockOrm.orderBy.mockResolvedValue([]);

      await discussionService.list(filters);

      expect(mockOrm.where).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new discussion', async () => {
      const payload: DiscussionInsert = {
        title: 'New Discussion',
        agentId: 1,
      };

      const mockCreated = {
        id: 1,
        ...payload,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOrm.returning.mockResolvedValue([mockCreated]);

      const result = await discussionService.create(payload);

      expect(result).toEqual(mockCreated);
      expect(mockOrm.insert).toHaveBeenCalled();
      expect(mockOrm.values).toHaveBeenCalled();
      expect(mockOrm.returning).toHaveBeenCalled();
    });

    it('should use default title if not provided', async () => {
      const payload: DiscussionInsert = {
        agentId: 1,
      };

      mockOrm.returning.mockResolvedValue([{ id: 1, title: 'New Discussion' }]);

      await discussionService.create(payload);

      expect(mockOrm.values).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Discussion',
        })
      );
    });
  });

  describe('update', () => {
    it('should update a discussion', async () => {
      const payload: DiscussionUpdate = {
        id: 1,
        title: 'Updated Title',
      };

      const mockUpdated = {
        id: 1,
        title: 'Updated Title',
        isFavorite: false,
        agentId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOrm.returning.mockResolvedValue([mockUpdated]);

      const result = await discussionService.update(payload);

      expect(result).toEqual(mockUpdated);
      expect(mockOrm.update).toHaveBeenCalled();
      expect(mockOrm.set).toHaveBeenCalled();
      expect(mockOrm.where).toHaveBeenCalled();
    });

    it('should update updatedAt timestamp', async () => {
      const payload: DiscussionUpdate = {
        id: 1,
        title: 'Updated Title',
      };

      mockOrm.returning.mockResolvedValue([{}]);

      await discussionService.update(payload);

      expect(mockOrm.set).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedAt: expect.any(Date),
        })
      );
    });
  });

  describe('getWithMessages', () => {
    it('should get a discussion with all its messages', async () => {
      const discussionId = 1;
      const mockDiscussion = {
        id: 1,
        title: 'Test Discussion',
        isFavorite: false,
        agentId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        agent: {
          id: 1,
          name: 'Test Agent',
          code: 'test-agent',
          description: 'Test description',
          systemPrompt: 'Test prompt',
          configuration: '{}',
          modelId: 1,
        },
      };

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

      // First call returns discussion
      mockOrm.where.mockResolvedValueOnce([mockDiscussion]);
      // Second call returns messages
      mockOrm.orderBy.mockResolvedValueOnce(mockMessages);

      const result = await discussionService.getWithMessages(discussionId);

      expect(result).toEqual({
        ...mockDiscussion,
        messages: mockMessages,
      });
      expect(mockOrm.select).toHaveBeenCalledTimes(2);
    });

    it('should return null if discussion not found', async () => {
      mockOrm.where.mockResolvedValueOnce([]);

      const result = await discussionService.getWithMessages(999);

      expect(result).toBeNull();
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite status', async () => {
      const discussionId = 1;

      // Mock current favorite status
      mockOrm.select.mockReturnThis();
      mockOrm.from.mockReturnThis();
      mockOrm.where.mockResolvedValueOnce([{ isFavorite: false }]);

      // Mock message count check
      mockOrm.select.mockReturnThis();
      mockOrm.from.mockReturnThis();
      mockOrm.where.mockResolvedValueOnce([{ count: 1 }]);

      // Mock update
      const mockUpdated = {
        id: 1,
        title: 'Test',
        isFavorite: true,
        agentId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockOrm.returning.mockResolvedValue([mockUpdated]);

      const result = await discussionService.toggleFavorite(discussionId);

      expect(result).toEqual(mockUpdated);
    });

    it('should throw error if no messages', async () => {
      const discussionId = 1;

      // Mock current favorite status
      mockOrm.where.mockResolvedValueOnce([{ isFavorite: false }]);

      // Mock message count check - no messages
      mockOrm.where.mockResolvedValueOnce([{ count: 0 }]);

      await expect(discussionService.toggleFavorite(discussionId)).rejects.toThrow(
        'Cannot favorite a discussion without messages'
      );
    });

    it('should return null if discussion not found', async () => {
      mockOrm.where.mockResolvedValueOnce([]);

      const result = await discussionService.toggleFavorite(999);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a discussion', async () => {
      const discussionId = 1;
      mockOrm.where.mockResolvedValue(undefined);

      const result = await discussionService.delete(discussionId);

      expect(result).toEqual({ ok: true });
      expect(mockOrm.delete).toHaveBeenCalled();
      expect(mockOrm.where).toHaveBeenCalled();
    });
  });
});