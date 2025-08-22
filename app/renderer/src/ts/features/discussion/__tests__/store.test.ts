import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  discussionStore,
  activeDiscussion,
  currentMessages,
  discussions,
  favoriteDiscussions,
  isLoading,
  error,
} from '../store';
import type { Discussion, Message, DiscussionWithMessages } from '../types';

describe('DiscussionStore', () => {
  beforeEach(() => {
    discussionStore.reset();
  });

  describe('Basic Operations', () => {
    it('should have initial state', () => {
      const state = get(discussionStore);
      
      expect(state.discussions).toEqual([]);
      expect(state.activeDiscussion).toBeNull();
      expect(state.currentMessages).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.filters).toEqual({});
    });

    it('should set discussions', () => {
      const mockDiscussions: Discussion[] = [
        {
          id: 1,
          title: 'Test',
          isFavorite: false,
          agentId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      discussionStore.setDiscussions(mockDiscussions);

      const state = get(discussionStore);
      expect(state.discussions).toEqual(mockDiscussions);
      expect(state.error).toBeNull();
    });

    it('should set active discussion', () => {
      const mockDiscussion: DiscussionWithMessages = {
        id: 1,
        title: 'Test',
        isFavorite: false,
        agentId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [
          {
            id: 1,
            who: 'user',
            content: 'Hello',
            discussionId: 1,
            createdAt: new Date(),
          },
        ],
      };

      discussionStore.setActiveDiscussion(mockDiscussion);

      const state = get(discussionStore);
      expect(state.activeDiscussion).toEqual(mockDiscussion);
      expect(state.currentMessages).toEqual(mockDiscussion.messages);
      expect(state.error).toBeNull();
    });

    it('should set loading state', () => {
      discussionStore.setLoading(true);
      
      let state = get(discussionStore);
      expect(state.isLoading).toBe(true);

      discussionStore.setLoading(false);
      
      state = get(discussionStore);
      expect(state.isLoading).toBe(false);
    });

    it('should set error', () => {
      discussionStore.setError('Test error');

      const state = get(discussionStore);
      expect(state.error).toBe('Test error');
      expect(state.isLoading).toBe(false);
    });

    it('should set filters', () => {
      const filters = { isFavorite: true };
      discussionStore.setFilters(filters);

      const state = get(discussionStore);
      expect(state.filters).toEqual(filters);
    });
  });

  describe('Message Operations', () => {
    beforeEach(() => {
      const mockDiscussion: DiscussionWithMessages = {
        id: 1,
        title: 'Test',
        isFavorite: false,
        agentId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
      };
      discussionStore.setActiveDiscussion(mockDiscussion);
    });

    it('should add a message', () => {
      const newMessage: Message = {
        id: 1,
        who: 'user',
        content: 'New message',
        discussionId: 1,
        createdAt: new Date(),
      };

      discussionStore.addMessage(newMessage);

      const state = get(discussionStore);
      expect(state.currentMessages).toContain(newMessage);
      expect(state.activeDiscussion?.messages).toContain(newMessage);
    });

    it('should update a message', () => {
      const message: Message = {
        id: 1,
        who: 'agent',
        content: 'Original',
        discussionId: 1,
        createdAt: new Date(),
      };

      discussionStore.addMessage(message);
      discussionStore.updateMessage(1, 'Updated content');

      const state = get(discussionStore);
      const updatedMessage = state.currentMessages.find(m => m.id === 1);
      expect(updatedMessage?.content).toBe('Updated content');
    });

    it('should add temporary message', () => {
      discussionStore.addTempMessage('user', 'Temp message');

      const state = get(discussionStore);
      const tempMessage = state.currentMessages.find(m => m.id < 0);
      
      expect(tempMessage).toBeTruthy();
      expect(tempMessage?.who).toBe('user');
      expect(tempMessage?.content).toBe('Temp message');
    });

    it('should replace temp message with real one', () => {
      discussionStore.addTempMessage('user', 'Temp');
      
      let state = get(discussionStore);
      const tempId = state.currentMessages[0].id;

      const realMessage: Message = {
        id: 100,
        who: 'user',
        content: 'Real message',
        discussionId: 1,
        createdAt: new Date(),
      };

      discussionStore.replaceTempMessage(tempId, realMessage);

      state = get(discussionStore);
      const replacedMessage = state.currentMessages.find(m => m.id === 100);
      
      expect(replacedMessage).toEqual(realMessage);
      expect(state.currentMessages.find(m => m.id === tempId)).toBeUndefined();
    });
  });

  describe('Discussion List Operations', () => {
    const mockDiscussion1: Discussion = {
      id: 1,
      title: 'Discussion 1',
      isFavorite: true,
      agentId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockDiscussion2: Discussion = {
      id: 2,
      title: 'Discussion 2',
      isFavorite: false,
      agentId: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      discussionStore.setDiscussions([mockDiscussion1, mockDiscussion2]);
    });

    it('should update discussion in list', () => {
      const updated: Discussion = {
        ...mockDiscussion1,
        title: 'Updated Title',
      };

      discussionStore.updateDiscussionInList(updated);

      const state = get(discussionStore);
      const discussion = state.discussions.find(d => d.id === 1);
      expect(discussion?.title).toBe('Updated Title');
    });

    it('should remove discussion from list', () => {
      discussionStore.removeDiscussionFromList(1);

      const state = get(discussionStore);
      expect(state.discussions).toHaveLength(1);
      expect(state.discussions[0].id).toBe(2);
    });

    it('should clear active discussion if it is removed', () => {
      discussionStore.setActiveDiscussion({
        ...mockDiscussion1,
        messages: [],
      });

      discussionStore.removeDiscussionFromList(1);

      const state = get(discussionStore);
      expect(state.activeDiscussion).toBeNull();
    });
  });

  describe('Utility Operations', () => {
    it('should clear active discussion', () => {
      const mockDiscussion: DiscussionWithMessages = {
        id: 1,
        title: 'Test',
        isFavorite: false,
        agentId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
      };

      discussionStore.setActiveDiscussion(mockDiscussion);
      discussionStore.clearActiveDiscussion();

      const state = get(discussionStore);
      expect(state.activeDiscussion).toBeNull();
      expect(state.currentMessages).toEqual([]);
    });

    it('should reset store', () => {
      discussionStore.setDiscussions([{
        id: 1,
        title: 'Test',
        isFavorite: false,
        agentId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]);
      discussionStore.setError('Some error');
      discussionStore.setLoading(true);

      discussionStore.reset();

      const state = get(discussionStore);
      expect(state.discussions).toEqual([]);
      expect(state.activeDiscussion).toBeNull();
      expect(state.currentMessages).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Derived Stores', () => {
    it('should provide active discussion', () => {
      const mockDiscussion: DiscussionWithMessages = {
        id: 1,
        title: 'Test',
        isFavorite: false,
        agentId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
      };

      discussionStore.setActiveDiscussion(mockDiscussion);

      expect(get(activeDiscussion)).toEqual(mockDiscussion);
    });

    it('should provide current messages', () => {
      const messages: Message[] = [
        {
          id: 1,
          who: 'user',
          content: 'Test',
          discussionId: 1,
          createdAt: new Date(),
        },
      ];

      discussionStore.setActiveDiscussion({
        id: 1,
        title: 'Test',
        isFavorite: false,
        agentId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages,
      });

      expect(get(currentMessages)).toEqual(messages);
    });

    it('should provide discussions list', () => {
      const mockDiscussions: Discussion[] = [
        {
          id: 1,
          title: 'Test',
          isFavorite: false,
          agentId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      discussionStore.setDiscussions(mockDiscussions);

      expect(get(discussions)).toEqual(mockDiscussions);
    });

    it('should provide favorite discussions', () => {
      const mockDiscussions: Discussion[] = [
        {
          id: 1,
          title: 'Favorite',
          isFavorite: true,
          agentId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          title: 'Not Favorite',
          isFavorite: false,
          agentId: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      discussionStore.setDiscussions(mockDiscussions);

      const favorites = get(favoriteDiscussions);
      expect(favorites).toHaveLength(1);
      expect(favorites[0].id).toBe(1);
    });

    it('should provide loading state', () => {
      discussionStore.setLoading(true);
      expect(get(isLoading)).toBe(true);

      discussionStore.setLoading(false);
      expect(get(isLoading)).toBe(false);
    });

    it('should provide error state', () => {
      discussionStore.setError('Test error');
      expect(get(error)).toBe('Test error');

      discussionStore.setError(null);
      expect(get(error)).toBeNull();
    });
  });
});