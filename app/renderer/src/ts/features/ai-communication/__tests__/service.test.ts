import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as adminService from '@features/admin/service';
import type { AIMessage, CommunicationOptions, AIResponse, StreamEvent, AgentContext } from '../types';

// Mock the admin service
vi.mock('@features/admin/service', () => ({
  listAgents: vi.fn(),
  listModels: vi.fn(), 
  listProviders: vi.fn(),
}));

// Mock the AI communication manager BEFORE importing the service
vi.mock('../manager', () => ({
  AICommunicationManager: vi.fn(),
}));

// Import after mocking
import { aiCommunicationService } from '../service';
import { AICommunicationManager } from '../manager';

describe('AICommunicationService', () => {
  let mockManager: any;
  let mockAgents: any[];
  let mockModels: any[];
  let mockProviders: any[];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock data
    mockProviders = [
      {
        id: 1,
        code: 'openai',
        name: 'OpenAI',
        url: 'https://api.openai.com',
        authentication: 'bearer',
        secretKey: 'sk-test',
        configuration: '{}',
      },
      {
        id: 2,
        code: 'anthropic',
        name: 'Anthropic',
        url: 'https://api.anthropic.com',
        authentication: 'bearer',
        secretKey: 'sk-ant-test',
        configuration: '{}',
      },
    ];

    mockModels = [
      {
        id: 1,
        code: 'gpt-4',
        name: 'GPT-4',
        providerId: 1,
        configuration: '{"temperature": 0.7}',
      },
      {
        id: 2,
        code: 'claude-3',
        name: 'Claude 3',
        providerId: 2,
        configuration: '{"temperature": 0.5}',
      },
    ];

    mockAgents = [
      {
        id: 1,
        code: 'assistant',
        name: 'AI Assistant',
        modelId: 1,
        systemMessage: 'You are a helpful assistant',
        configuration: '{}',
        isActive: true,
      },
      {
        id: 2,
        code: 'translator',
        name: 'Translator',
        modelId: 2,
        systemMessage: 'You are a professional translator',
        configuration: '{}',
        isActive: true,
      },
    ];

    // Setup manager mock functions
    mockManager = {
      communicateWithAgent: vi.fn(),
      streamWithAgent: vi.fn(),
      validateAgentConfiguration: vi.fn(),
      clearAdapterCache: vi.fn(),
      getAdapterCacheSize: vi.fn().mockReturnValue(2),
    };

    // Mock the constructor to return our mock manager
    vi.mocked(AICommunicationManager).mockImplementation(() => mockManager);

    // Access the private manager property and replace it
    (aiCommunicationService as any).manager = mockManager;

    // Setup admin service mocks
    vi.mocked(adminService.listAgents).mockResolvedValue(mockAgents);
    vi.mocked(adminService.listModels).mockResolvedValue(mockModels);
    vi.mocked(adminService.listProviders).mockResolvedValue(mockProviders);
  });

  describe('sendMessageToAgent', () => {
    test('should send message to agent successfully', async () => {
      const mockResponse: AIResponse = {
        content: 'Hello! How can I help you?',
        metadata: { tokensUsed: 50, model: 'gpt-4' },
      };

      mockManager.communicateWithAgent.mockResolvedValue(mockResponse);

      const result = await aiCommunicationService.sendMessageToAgent(
        1,
        'Hello, assistant!'
      );

      expect(adminService.listAgents).toHaveBeenCalledTimes(1);
      expect(adminService.listModels).toHaveBeenCalledTimes(1);
      expect(adminService.listProviders).toHaveBeenCalledTimes(1);

      expect(mockManager.communicateWithAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          agent: mockAgents[0],
          model: mockModels[0],
          provider: mockProviders[0],
        }),
        [expect.objectContaining({
          role: 'user',
          content: 'Hello, assistant!',
          metadata: { timestamp: expect.any(Number) },
        })],
        {}
      );

      expect(result).toEqual(mockResponse);
    });

    test('should pass communication options', async () => {
      const options: CommunicationOptions = {
        temperature: 0.8,
        maxTokens: 1000,
      };

      const mockResponse: AIResponse = {
        content: 'Response with custom options',
        metadata: { tokensUsed: 100 },
      };

      mockManager.communicateWithAgent.mockResolvedValue(mockResponse);

      await aiCommunicationService.sendMessageToAgent(
        1,
        'Test message',
        options
      );

      expect(mockManager.communicateWithAgent).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Array),
        options
      );
    });

    test('should handle agent not found error', async () => {
      await expect(
        aiCommunicationService.sendMessageToAgent(999, 'Hello')
      ).rejects.toThrow('Agent with ID 999 not found');

      expect(mockManager.communicateWithAgent).not.toHaveBeenCalled();
    });

    test('should handle agent without model error', async () => {
      const agentWithoutModel = { ...mockAgents[0], modelId: null };
      vi.mocked(adminService.listAgents).mockResolvedValue([agentWithoutModel]);

      await expect(
        aiCommunicationService.sendMessageToAgent(1, 'Hello')
      ).rejects.toThrow('Agent 1 does not have an associated model');
    });

    test('should handle model not found error', async () => {
      const agentWithInvalidModel = { ...mockAgents[0], modelId: 999 };
      vi.mocked(adminService.listAgents).mockResolvedValue([agentWithInvalidModel]);

      await expect(
        aiCommunicationService.sendMessageToAgent(1, 'Hello')
      ).rejects.toThrow('Model with ID 999 not found');
    });

    test('should handle provider not found error', async () => {
      const modelWithInvalidProvider = { ...mockModels[0], providerId: 999 };
      vi.mocked(adminService.listModels).mockResolvedValue([modelWithInvalidProvider]);

      await expect(
        aiCommunicationService.sendMessageToAgent(1, 'Hello')
      ).rejects.toThrow('Provider with ID 999 not found');
    });

    test('should handle communication errors', async () => {
      const error = new Error('API rate limit exceeded');
      mockManager.communicateWithAgent.mockRejectedValue(error);

      await expect(
        aiCommunicationService.sendMessageToAgent(1, 'Hello')
      ).rejects.toThrow('API rate limit exceeded');
    });

    test('should handle unknown errors', async () => {
      mockManager.communicateWithAgent.mockRejectedValue('Unknown error');

      await expect(
        aiCommunicationService.sendMessageToAgent(1, 'Hello')
      ).rejects.toThrow('Unknown error');
    });
  });

  describe('streamMessageToAgent', () => {
    test('should stream message to agent successfully', async () => {
      const mockStreamEvents: StreamEvent[] = [
        { type: 'start' },
        { type: 'content', content: 'Hello' },
        { type: 'content', content: ' there!' },
        { type: 'end', content: 'Hello there!' },
      ];

      mockManager.streamWithAgent.mockImplementation(async function* () {
        for (const event of mockStreamEvents) {
          yield event;
        }
      });

      const events: StreamEvent[] = [];
      for await (const event of aiCommunicationService.streamMessageToAgent(
        1,
        'Hello, assistant!'
      )) {
        events.push(event);
      }

      expect(mockManager.streamWithAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          agent: mockAgents[0],
          model: mockModels[0],
          provider: mockProviders[0],
        }),
        [expect.objectContaining({
          role: 'user',
          content: 'Hello, assistant!',
        })],
        {}
      );

      expect(events).toEqual(mockStreamEvents);
    });

    test('should handle streaming errors', async () => {
      const error = new Error('Streaming failed');
      mockManager.streamWithAgent.mockImplementation(async function* () {
        throw error;
      });

      const events: StreamEvent[] = [];
      for await (const event of aiCommunicationService.streamMessageToAgent(1, 'Hello')) {
        events.push(event);
      }

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        type: 'error',
        error: expect.any(Error),
      });
    });
  });

  describe('sendConversationToAgent', () => {
    test('should send conversation to agent', async () => {
      const messages: AIMessage[] = [
        { role: 'user', content: 'What is 2+2?' },
        { role: 'assistant', content: '2+2 equals 4.' },
        { role: 'user', content: 'What about 3+3?' },
      ];

      const mockResponse: AIResponse = {
        content: '3+3 equals 6.',
        metadata: { tokensUsed: 75 },
      };

      mockManager.communicateWithAgent.mockResolvedValue(mockResponse);

      const result = await aiCommunicationService.sendConversationToAgent(
        1,
        messages
      );

      expect(mockManager.communicateWithAgent).toHaveBeenCalledWith(
        expect.any(Object),
        messages,
        {}
      );

      expect(result).toEqual(mockResponse);
    });

    test('should handle conversation errors', async () => {
      const error = new Error('Conversation processing failed');
      mockManager.communicateWithAgent.mockRejectedValue(error);

      await expect(
        aiCommunicationService.sendConversationToAgent(1, [])
      ).rejects.toThrow('Conversation processing failed');
    });
  });

  describe('streamConversationToAgent', () => {
    test('should stream conversation to agent', async () => {
      const messages: AIMessage[] = [
        { role: 'user', content: 'Tell me a story' },
      ];

      const mockStreamEvents: StreamEvent[] = [
        { type: 'start' },
        { type: 'content', content: 'Once upon a time...' },
        { type: 'end', content: 'Once upon a time...' },
      ];

      mockManager.streamWithAgent.mockImplementation(async function* () {
        for (const event of mockStreamEvents) {
          yield event;
        }
      });

      const events: StreamEvent[] = [];
      for await (const event of aiCommunicationService.streamConversationToAgent(1, messages)) {
        events.push(event);
      }

      expect(mockManager.streamWithAgent).toHaveBeenCalledWith(
        expect.any(Object),
        messages,
        {}
      );

      expect(events).toEqual(mockStreamEvents);
    });
  });

  describe('validateAgent', () => {
    test('should validate agent configuration successfully', async () => {
      mockManager.validateAgentConfiguration.mockResolvedValue(true);

      const result = await aiCommunicationService.validateAgent(1);

      expect(mockManager.validateAgentConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          agent: mockAgents[0],
          model: mockModels[0],
          provider: mockProviders[0],
        })
      );

      expect(result).toBe(true);
    });

    test('should handle validation failure', async () => {
      mockManager.validateAgentConfiguration.mockResolvedValue(false);

      const result = await aiCommunicationService.validateAgent(1);

      expect(result).toBe(false);
    });

    test('should handle validation errors', async () => {
      mockManager.validateAgentConfiguration.mockRejectedValue(
        new Error('Validation error')
      );

      const result = await aiCommunicationService.validateAgent(1);

      expect(result).toBe(false);
    });

    test('should handle agent not found during validation', async () => {
      const result = await aiCommunicationService.validateAgent(999);

      expect(result).toBe(false);
      expect(mockManager.validateAgentConfiguration).not.toHaveBeenCalled();
    });
  });

  describe('getAgentContext', () => {
    test('should return complete agent context', async () => {
      const context = await aiCommunicationService.getAgentContext(1);

      expect(context).toEqual({
        agent: mockAgents[0],
        model: mockModels[0],
        provider: mockProviders[0],
      });
    });

    test('should throw error for non-existent agent', async () => {
      await expect(
        aiCommunicationService.getAgentContext(999)
      ).rejects.toThrow('Agent with ID 999 not found');
    });
  });

  describe('cache management', () => {
    test('should clear adapter cache', () => {
      aiCommunicationService.clearCache();

      expect(mockManager.clearAdapterCache).toHaveBeenCalledTimes(1);
    });

    test('should return cache statistics', () => {
      const stats = aiCommunicationService.getCacheStats();

      expect(mockManager.getAdapterCacheSize).toHaveBeenCalledTimes(1);
      expect(stats).toEqual({
        adapterCacheSize: 2,
      });
    });
  });

  describe('error handling', () => {
    test('should handle string errors', async () => {
      mockManager.communicateWithAgent.mockRejectedValue('String error');

      await expect(
        aiCommunicationService.sendMessageToAgent(1, 'Hello')
      ).rejects.toThrow('String error');
    });

    test('should handle error objects with message property', async () => {
      mockManager.communicateWithAgent.mockRejectedValue({
        message: 'Object error message',
      });

      await expect(
        aiCommunicationService.sendMessageToAgent(1, 'Hello')
      ).rejects.toThrow('Object error message');
    });

    test('should handle unknown error types', async () => {
      mockManager.communicateWithAgent.mockRejectedValue(null);

      await expect(
        aiCommunicationService.sendMessageToAgent(1, 'Hello')
      ).rejects.toThrow('Unknown error occurred in AI communication service');
    });
  });

  describe('loadAgentContext caching', () => {
    test('should load context data for each request', async () => {
      // First call
      await aiCommunicationService.getAgentContext(1);
      
      // Second call
      await aiCommunicationService.getAgentContext(2);

      // Should call admin services twice (no caching at service level)
      expect(adminService.listAgents).toHaveBeenCalledTimes(2);
      expect(adminService.listModels).toHaveBeenCalledTimes(2);
      expect(adminService.listProviders).toHaveBeenCalledTimes(2);
    });
  });

  describe('message metadata', () => {
    test('should add timestamp metadata to user messages', async () => {
      mockManager.communicateWithAgent.mockResolvedValue({
        content: 'Response',
        metadata: {},
      });

      const beforeTimestamp = Date.now();
      await aiCommunicationService.sendMessageToAgent(1, 'Hello');
      const afterTimestamp = Date.now();

      const calledWith = mockManager.communicateWithAgent.mock.calls[0];
      const messages = calledWith[1] as AIMessage[];
      const timestamp = messages[0].metadata?.timestamp;

      expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(timestamp).toBeLessThanOrEqual(afterTimestamp);
    });
  });
});