import { describe, test, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { 
  aiCommunicationStore,
  activeConversation,
  conversationsList,
  isAnyStreaming,
  totalUsage
} from '../store';

describe('AI Communication Store', () => {
  beforeEach(() => {
    // Reset state before each test
    aiCommunicationStore.reset();
  });

  describe('aiCommunicationStore', () => {
    test('should have initial state', () => {
      const state = get(aiCommunicationStore);
      expect(state).toEqual({
        conversations: new Map(),
        activeConversation: null,
        isInitialized: false,
        error: null
      });
    });

    test('should initialize successfully', () => {
      aiCommunicationStore.initialize();
      const state = get(aiCommunicationStore);
      
      expect(state.isInitialized).toBe(true);
      expect(state.error).toBeNull();
    });

    test('should set and clear errors', () => {
      const errorMessage = 'Connection failed';
      aiCommunicationStore.setError(errorMessage);
      
      let state = get(aiCommunicationStore);
      expect(state.error).toBe(errorMessage);
      
      aiCommunicationStore.setError(null);
      state = get(aiCommunicationStore);
      expect(state.error).toBeNull();
    });
  });

  describe('conversation management', () => {
    test('should create a new conversation', () => {
      const agentId = 1;
      aiCommunicationStore.createConversation(agentId);
      
      const state = get(aiCommunicationStore);
      expect(state.conversations.has(agentId)).toBe(true);
      expect(state.activeConversation).toBe(agentId);
      
      const conversation = state.conversations.get(agentId);
      expect(conversation).toEqual({
        agentId: 1,
        messages: [],
        isStreaming: false,
        usage: {
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalTokens: 0
        }
      });
    });

    test('should set active conversation', () => {
      const agentId = 1;
      aiCommunicationStore.createConversation(agentId);
      aiCommunicationStore.setActiveConversation(null);
      
      let state = get(aiCommunicationStore);
      expect(state.activeConversation).toBeNull();
      
      aiCommunicationStore.setActiveConversation(agentId);
      state = get(aiCommunicationStore);
      expect(state.activeConversation).toBe(agentId);
    });

    test('should add messages to conversation', () => {
      const agentId = 1;
      aiCommunicationStore.createConversation(agentId);
      
      const userMessage = {
        role: 'user' as const,
        content: 'Hello',
        metadata: { timestamp: Date.now() }
      };
      
      aiCommunicationStore.addMessage(agentId, userMessage);
      
      const state = get(aiCommunicationStore);
      const conversation = state.conversations.get(agentId);
      expect(conversation?.messages).toHaveLength(1);
      expect(conversation?.messages[0]).toEqual(userMessage);
    });

    test('should delete conversation', () => {
      const agentId = 1;
      aiCommunicationStore.createConversation(agentId);
      
      let state = get(aiCommunicationStore);
      expect(state.conversations.has(agentId)).toBe(true);
      expect(state.activeConversation).toBe(agentId);
      
      aiCommunicationStore.deleteConversation(agentId);
      state = get(aiCommunicationStore);
      expect(state.conversations.has(agentId)).toBe(false);
      expect(state.activeConversation).toBeNull();
    });

    test('should clear all conversations', () => {
      aiCommunicationStore.createConversation(1);
      aiCommunicationStore.createConversation(2);
      
      let state = get(aiCommunicationStore);
      expect(state.conversations.size).toBe(2);
      
      aiCommunicationStore.clearAllConversations();
      state = get(aiCommunicationStore);
      expect(state.conversations.size).toBe(0);
      expect(state.activeConversation).toBeNull();
    });
  });

  describe('streaming functionality', () => {
    test('should handle streaming lifecycle', () => {
      const agentId = 1;
      aiCommunicationStore.createConversation(agentId);
      
      // Start streaming
      aiCommunicationStore.startStreaming(agentId);
      let state = get(aiCommunicationStore);
      let conversation = state.conversations.get(agentId);
      expect(conversation?.isStreaming).toBe(true);
      expect(conversation?.currentResponse).toBe('');
      
      // Append content
      aiCommunicationStore.appendStreamContent(agentId, 'Hello ');
      aiCommunicationStore.appendStreamContent(agentId, 'world!');
      state = get(aiCommunicationStore);
      conversation = state.conversations.get(agentId);
      expect(conversation?.currentResponse).toBe('Hello world!');
      
      // Complete streaming
      aiCommunicationStore.completeStreaming(agentId);
      state = get(aiCommunicationStore);
      conversation = state.conversations.get(agentId);
      expect(conversation?.isStreaming).toBe(false);
      expect(conversation?.currentResponse).toBeUndefined();
      expect(conversation?.messages).toHaveLength(1);
      expect(conversation?.messages[0].content).toBe('Hello world!');
      expect(conversation?.messages[0].role).toBe('assistant');
    });

    test('should handle streaming errors', () => {
      const agentId = 1;
      aiCommunicationStore.createConversation(agentId);
      aiCommunicationStore.startStreaming(agentId);
      
      const errorMessage = 'Stream failed';
      aiCommunicationStore.setStreamingError(agentId, errorMessage);
      
      const state = get(aiCommunicationStore);
      const conversation = state.conversations.get(agentId);
      expect(conversation?.isStreaming).toBe(false);
      expect(conversation?.currentResponse).toBeUndefined();
      expect(conversation?.error).toBe(errorMessage);
    });
  });

  describe('usage tracking', () => {
    test('should update usage statistics', () => {
      const agentId = 1;
      aiCommunicationStore.createConversation(agentId);
      
      aiCommunicationStore.updateUsage(agentId, 100, 50);
      
      const state = get(aiCommunicationStore);
      const conversation = state.conversations.get(agentId);
      expect(conversation?.usage).toEqual({
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalTokens: 150
      });
      
      // Add more usage
      aiCommunicationStore.updateUsage(agentId, 50, 25);
      const updatedState = get(aiCommunicationStore);
      const updatedConversation = updatedState.conversations.get(agentId);
      expect(updatedConversation?.usage).toEqual({
        totalInputTokens: 150,
        totalOutputTokens: 75,
        totalTokens: 225
      });
    });
  });

  describe('derived stores', () => {
    test('activeConversation should return active conversation', () => {
      expect(get(activeConversation)).toBeUndefined();
      
      const agentId = 1;
      aiCommunicationStore.createConversation(agentId);
      
      const active = get(activeConversation);
      expect(active?.agentId).toBe(agentId);
    });

    test('conversationsList should return array of conversations', () => {
      expect(get(conversationsList)).toEqual([]);
      
      aiCommunicationStore.createConversation(1);
      aiCommunicationStore.createConversation(2);
      
      const list = get(conversationsList);
      expect(list).toHaveLength(2);
      expect(list.map(c => c.agentId)).toEqual(expect.arrayContaining([1, 2]));
    });

    test('isAnyStreaming should track streaming state', () => {
      expect(get(isAnyStreaming)).toBe(false);
      
      aiCommunicationStore.createConversation(1);
      aiCommunicationStore.startStreaming(1);
      
      expect(get(isAnyStreaming)).toBe(true);
      
      aiCommunicationStore.completeStreaming(1);
      expect(get(isAnyStreaming)).toBe(false);
    });

    test('totalUsage should aggregate usage across conversations', () => {
      expect(get(totalUsage)).toEqual({
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0
      });
      
      aiCommunicationStore.createConversation(1);
      aiCommunicationStore.createConversation(2);
      
      aiCommunicationStore.updateUsage(1, 100, 50);
      aiCommunicationStore.updateUsage(2, 200, 100);
      
      expect(get(totalUsage)).toEqual({
        totalInputTokens: 300,
        totalOutputTokens: 150,
        totalTokens: 450
      });
    });
  });
});