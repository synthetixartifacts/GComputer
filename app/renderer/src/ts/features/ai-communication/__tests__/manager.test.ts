import { describe, test, expect, beforeEach, vi } from 'vitest';
import { AICommunicationManager } from '../manager';
import { OpenAIAdapter } from '../adapters/openai';
import { AnthropicAdapter } from '../adapters/anthropic';
import type { AgentContext, AIMessage, CommunicationOptions, AIResponse } from '../types';

// Mock the adapters
vi.mock('../adapters/openai', () => ({
  OpenAIAdapter: vi.fn(),
}));

vi.mock('../adapters/anthropic', () => ({
  AnthropicAdapter: vi.fn(),
}));

describe('AICommunicationManager', () => {
  let manager: AICommunicationManager;
  let mockOpenAIAdapter: any;
  let mockAnthropicAdapter: any;
  let mockAgentContext: AgentContext;
  let mockMessages: AIMessage[];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock adapter instances
    mockOpenAIAdapter = {
      sendMessage: vi.fn(),
      streamMessage: vi.fn(),
      validateConfiguration: vi.fn(),
    };
    
    mockAnthropicAdapter = {
      sendMessage: vi.fn(),
      streamMessage: vi.fn(),
      validateConfiguration: vi.fn(),
    };
    
    // Mock adapter constructors
    vi.mocked(OpenAIAdapter).mockImplementation(() => mockOpenAIAdapter);
    vi.mocked(AnthropicAdapter).mockImplementation(() => mockAnthropicAdapter);
    
    manager = new AICommunicationManager();
    
    // Mock agent context
    mockAgentContext = {
      agent: {
        id: 1,
        code: 'test-agent',
        name: 'Test Agent',
        systemPrompt: 'You are a helpful assistant',
        modelId: 1,
        configuration: '{}',
        isActive: true,
      },
      model: {
        id: 1,
        code: 'gpt-4',
        name: 'GPT-4',
        model: 'gpt-4',
        providerId: 1,
        configuration: '{"temperature": 0.7}',
        endpoint: '/v1/chat/completions',
        params: '{"temperature": 0.7, "max_tokens": 150}',
        messageLocation: 'choices[0].message.content',
        messageStreamLocation: undefined,
        inputTokenCountLocation: 'usage.prompt_tokens',
        outputTokenCountLocation: 'usage.completion_tokens',
      },
      provider: {
        id: 1,
        code: 'openai',
        name: 'OpenAI',
        url: 'https://api.openai.com',
        authentication: 'bearer',
        secretKey: 'sk-test',
        configuration: '{}',
      },
    };
    
    mockMessages = [
      {
        role: 'user',
        content: 'Hello, how are you?',
        metadata: { timestamp: Date.now() },
      },
    ];
  });

  describe('communicateWithAgent', () => {
    test('should communicate with OpenAI provider successfully', async () => {
      const mockResponse: AIResponse = {
        content: 'Hello! I am doing well, thank you for asking.',
        metadata: { tokensUsed: 25, model: 'gpt-4' },
      };
      
      mockOpenAIAdapter.sendMessage.mockResolvedValue(mockResponse);
      
      const result = await manager.communicateWithAgent(mockAgentContext, mockMessages);
      
      expect(result).toEqual(mockResponse);
      expect(mockOpenAIAdapter.sendMessage).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: 'You are a helpful assistant',
          }),
          expect.objectContaining({
            role: 'user',
            content: 'Hello, how are you?',
          }),
        ]),
        {}
      );
    });

    test('should communicate with Anthropic provider successfully', async () => {
      const anthropicContext = {
        ...mockAgentContext,
        provider: {
          ...mockAgentContext.provider,
          code: 'anthropic',
        },
      };
      
      const mockResponse: AIResponse = {
        content: 'Hello! I am Claude, how can I assist you?',
        metadata: { tokensUsed: 30, model: 'claude-3' },
      };
      
      mockAnthropicAdapter.sendMessage.mockResolvedValue(mockResponse);
      
      const result = await manager.communicateWithAgent(anthropicContext, mockMessages);
      
      expect(result).toEqual(mockResponse);
      expect(mockAnthropicAdapter.sendMessage).toHaveBeenCalled();
    });

    test('should pass communication options to adapter', async () => {
      const options: CommunicationOptions = {
        temperature: 0.8,
        maxTokens: 1000,
      };
      
      mockOpenAIAdapter.sendMessage.mockResolvedValue({
        content: 'Response',
        metadata: {},
      });
      
      await manager.communicateWithAgent(mockAgentContext, mockMessages, options);
      
      expect(mockOpenAIAdapter.sendMessage).toHaveBeenCalledWith(
        expect.any(Array),
        options
      );
    });

    test('should handle unknown provider gracefully', async () => {
      const unknownProviderContext = {
        ...mockAgentContext,
        provider: {
          ...mockAgentContext.provider,
          code: 'unknown',
        },
      };
      
      await expect(
        manager.communicateWithAgent(unknownProviderContext, mockMessages)
      ).rejects.toThrow('Unsupported provider: unknown');
    });
  });

  describe('streamWithAgent', () => {
    test('should stream messages from OpenAI provider', async () => {
      const mockStreamEvents = [
        { type: 'start', data: {} },
        { type: 'content', data: { delta: 'Hello' } },
        { type: 'content', data: { delta: ' world' } },
        { type: 'end', data: {} },
      ];
      
      async function* mockStream() {
        for (const event of mockStreamEvents) {
          yield event;
        }
      }
      
      mockOpenAIAdapter.streamMessage.mockImplementation(mockStream);
      
      const events = [];
      for await (const event of manager.streamWithAgent(mockAgentContext, mockMessages)) {
        events.push(event);
      }
      
      expect(events).toEqual(mockStreamEvents);
      expect(mockOpenAIAdapter.streamMessage).toHaveBeenCalledWith(
        expect.any(Array),
        { stream: true }
      );
    });

    test('should pass stream option to adapter', async () => {
      async function* mockStream() {
        yield { type: 'content', data: { delta: 'test' } };
      }
      
      mockOpenAIAdapter.streamMessage.mockImplementation(mockStream);
      
      const options: CommunicationOptions = {
        temperature: 0.5,
      };
      
      const iterator = manager.streamWithAgent(mockAgentContext, mockMessages, options);
      const firstEvent = await iterator.next();
      
      expect(mockOpenAIAdapter.streamMessage).toHaveBeenCalledWith(
        expect.any(Array),
        { ...options, stream: true }
      );
    });
  });

  describe('validateAgentConfiguration', () => {
    test('should validate OpenAI configuration successfully', async () => {
      mockOpenAIAdapter.validateConfiguration.mockResolvedValue(true);
      
      const result = await manager.validateAgentConfiguration(mockAgentContext);
      
      expect(result).toBe(true);
      expect(mockOpenAIAdapter.validateConfiguration).toHaveBeenCalled();
    });

    test('should handle validation failure', async () => {
      mockOpenAIAdapter.validateConfiguration.mockResolvedValue(false);
      
      const result = await manager.validateAgentConfiguration(mockAgentContext);
      
      expect(result).toBe(false);
    });

    test('should handle validation errors gracefully', async () => {
      mockOpenAIAdapter.validateConfiguration.mockRejectedValue(
        new Error('API key invalid')
      );
      
      const result = await manager.validateAgentConfiguration(mockAgentContext);
      
      expect(result).toBe(false);
    });
  });

  describe('cache management', () => {
    test('should clear adapter cache', () => {
      // Create some adapters
      manager.communicateWithAgent(mockAgentContext, mockMessages);
      
      manager.clearAdapterCache();
      
      // Cache should be empty
      expect(manager.getAdapterCacheSize()).toBe(0);
    });

    test('should return correct cache size', async () => {
      // Initially empty
      expect(manager.getAdapterCacheSize()).toBe(0);
      
      // Create adapter for OpenAI
      mockOpenAIAdapter.sendMessage.mockResolvedValue({
        content: 'test',
        metadata: {},
      });
      
      await manager.communicateWithAgent(mockAgentContext, mockMessages);
      expect(manager.getAdapterCacheSize()).toBe(1);
      
      // Create adapter for Anthropic
      const anthropicContext = {
        ...mockAgentContext,
        provider: { ...mockAgentContext.provider, code: 'anthropic' },
      };
      
      mockAnthropicAdapter.sendMessage.mockResolvedValue({
        content: 'test',
        metadata: {},
      });
      
      await manager.communicateWithAgent(anthropicContext, mockMessages);
      expect(manager.getAdapterCacheSize()).toBe(2);
    });
  });

  describe('message preparation', () => {
    test('should include system message from agent', async () => {
      mockOpenAIAdapter.sendMessage.mockResolvedValue({
        content: 'response',
        metadata: {},
      });
      
      await manager.communicateWithAgent(mockAgentContext, mockMessages);
      
      const [messages] = mockOpenAIAdapter.sendMessage.mock.calls[0];
      expect(messages[0]).toEqual({
        role: 'system',
        content: 'You are a helpful assistant',
        metadata: { source: 'agent' },
      });
    });

    test('should append user messages after system message', async () => {
      const multipleMessages = [
        {
          role: 'user' as const,
          content: 'First message',
          metadata: { timestamp: Date.now() },
        },
        {
          role: 'user' as const,
          content: 'Second message',
          metadata: { timestamp: Date.now() + 1000 },
        },
      ];
      
      mockOpenAIAdapter.sendMessage.mockResolvedValue({
        content: 'response',
        metadata: {},
      });
      
      await manager.communicateWithAgent(mockAgentContext, multipleMessages);
      
      const [messages] = mockOpenAIAdapter.sendMessage.mock.calls[0];
      expect(messages).toHaveLength(3); // 1 system + 2 user
      expect(messages[1].content).toBe('First message');
      expect(messages[2].content).toBe('Second message');
    });
  });
});