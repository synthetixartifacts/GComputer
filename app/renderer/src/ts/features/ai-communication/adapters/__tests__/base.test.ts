import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BaseProviderAdapter } from '../base';
import type { AIMessage, CommunicationOptions, AIResponse, ProviderConfiguration, ModelConfiguration, StreamEvent } from '../../types';

// Concrete implementation for testing
class TestAdapter extends BaseProviderAdapter {
  async sendMessage(messages: AIMessage[], options: CommunicationOptions): Promise<AIResponse> {
    return {
      content: 'Test response',
      metadata: { tokensUsed: 10, model: 'test-model' },
    };
  }

  async *streamMessage(messages: AIMessage[], options: CommunicationOptions): AsyncIterableIterator<StreamEvent> {
    yield { type: 'content', data: { delta: 'Test stream' } };
  }

  async validateConfiguration(): Promise<boolean> {
    return await this.validateApiKey();
  }
  
  // Expose protected methods for testing
  public testBuildHeaders() {
    return this.buildHeaders();
  }
  
  public testBuildUrl(endpoint?: string) {
    return this.buildUrl(endpoint);
  }
  
  public testFormatMessages(messages: AIMessage[]) {
    return this.formatMessages(messages);
  }
  
  public testBuildRequestBody(messages: AIMessage[], options: CommunicationOptions) {
    return this.buildRequestBody(messages, options);
  }
  
  public testExtractContent(response: any) {
    return this.extractContent(response);
  }
  
  public testExtractStreamContent(chunk: any) {
    return this.extractStreamContent(chunk);
  }
  
  public testExtractUsage(response: any) {
    return this.extractUsage(response);
  }
  
  public testHandleError(error: any) {
    return this.handleError(error);
  }
}

describe('BaseProviderAdapter', () => {
  let adapter: TestAdapter;
  let mockProvider: ProviderConfiguration;
  let mockModel: ModelConfiguration;

  beforeEach(() => {
    mockProvider = {
      id: 1,
      code: 'test',
      name: 'Test Provider',
      url: 'https://api.test.com/',
      authentication: 'bearer',
      secretKey: 'test-key',
      configuration: { temperature: 0.7 },
    };
    
    mockModel = {
      id: 1,
      providerId: 1,
      model: 'test-model',
      name: 'Test Model',
      endpoint: '/v1/chat/completions',
      messageLocation: 'choices[0].message.content',
      messageStreamLocation: 'choices[0].delta.content',
      inputTokenCountLocation: 'usage.prompt_tokens',
      outputTokenCountLocation: 'usage.completion_tokens',
      params: {
        temperature: 0.7,
        max_tokens: 1000
      }
    };
    
    adapter = new TestAdapter(mockProvider, mockModel);
  });

  describe('constructor', () => {
    test('should initialize with provider and model configuration', () => {
      expect(adapter.provider).toEqual(mockProvider);
      expect(adapter.model).toEqual(mockModel);
    });
  });

  describe('buildHeaders', () => {
    test('should build headers with bearer authentication', () => {
      const headers = adapter.testBuildHeaders();
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-key'
      });
    });

    test('should build headers with x-api-key authentication', () => {
      mockProvider.authentication = 'x-api-key';
      adapter = new TestAdapter(mockProvider, mockModel);
      const headers = adapter.testBuildHeaders();
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'x-api-key': 'test-key'
      });
    });

    test('should build headers with custom authentication', () => {
      mockProvider.authentication = 'custom';
      mockProvider.configuration = { 
        headers: { 
          'X-Custom-Header': 'custom-value' 
        } 
      };
      adapter = new TestAdapter(mockProvider, mockModel);
      const headers = adapter.testBuildHeaders();
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value'
      });
    });

    test('should handle custom authentication without headers config', () => {
      mockProvider.authentication = 'custom';
      mockProvider.configuration = {};
      adapter = new TestAdapter(mockProvider, mockModel);
      const headers = adapter.testBuildHeaders();
      expect(headers).toEqual({
        'Content-Type': 'application/json'
      });
    });
  });

  describe('buildUrl', () => {
    test('should build URL with model endpoint', () => {
      const url = adapter.testBuildUrl();
      expect(url).toBe('https://api.test.com/v1/chat/completions');
    });

    test('should build URL with custom endpoint', () => {
      const url = adapter.testBuildUrl('/custom/endpoint');
      expect(url).toBe('https://api.test.com/custom/endpoint');
    });

    test('should handle URL with trailing slash', () => {
      mockProvider.url = 'https://api.test.com/';
      adapter = new TestAdapter(mockProvider, mockModel);
      const url = adapter.testBuildUrl();
      expect(url).toBe('https://api.test.com/v1/chat/completions');
    });
  });

  describe('formatMessages', () => {
    test('should format messages correctly', () => {
      const messages: AIMessage[] = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello', metadata: { timestamp: 123456 } },
        { role: 'assistant', content: 'Hi there!' }
      ];
      
      const formatted = adapter.testFormatMessages(messages);
      expect(formatted).toEqual([
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ]);
    });

    test('should handle empty messages array', () => {
      const formatted = adapter.testFormatMessages([]);
      expect(formatted).toEqual([]);
    });
  });

  describe('buildRequestBody', () => {
    test('should build basic request body', () => {
      const messages: AIMessage[] = [
        { role: 'user', content: 'Hello' }
      ];
      
      const body = adapter.testBuildRequestBody(messages, {});
      expect(body).toEqual({
        temperature: 0.7,
        max_tokens: 1000,
        model: 'test-model',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: false
      });
    });

    test('should include temperature from options', () => {
      const messages: AIMessage[] = [{ role: 'user', content: 'Hello' }];
      const body = adapter.testBuildRequestBody(messages, { temperature: 0.9 });
      expect(body.temperature).toBe(0.9);
    });

    test('should include maxTokens from options', () => {
      const messages: AIMessage[] = [{ role: 'user', content: 'Hello' }];
      const body = adapter.testBuildRequestBody(messages, { maxTokens: 2000 });
      expect(body.max_tokens).toBe(2000);
    });

    test('should include stream from options', () => {
      const messages: AIMessage[] = [{ role: 'user', content: 'Hello' }];
      const body = adapter.testBuildRequestBody(messages, { stream: true });
      expect(body.stream).toBe(true);
    });

    test('should include additionalParams from options', () => {
      const messages: AIMessage[] = [{ role: 'user', content: 'Hello' }];
      const body = adapter.testBuildRequestBody(messages, { 
        additionalParams: { 
          top_p: 0.95,
          frequency_penalty: 0.5 
        }
      });
      expect(body.top_p).toBe(0.95);
      expect(body.frequency_penalty).toBe(0.5);
    });
  });

  describe('extractContent', () => {
    test('should extract content from OpenAI-style response', () => {
      const response = {
        choices: [{
          message: {
            content: 'Hello world'
          }
        }]
      };
      
      const content = adapter.testExtractContent(response);
      expect(content).toBe('Hello world');
    });

    test('should handle missing content path', () => {
      const response = { someOtherField: 'value' };
      const content = adapter.testExtractContent(response);
      expect(content).toBe('');
    });

    test('should handle null response', () => {
      const content = adapter.testExtractContent(null);
      expect(content).toBe('');
    });

    test('should handle nested array paths', () => {
      mockModel.messageLocation = 'data[2].text';
      adapter = new TestAdapter(mockProvider, mockModel);
      const response = {
        data: [
          { text: 'first' },
          { text: 'second' },
          { text: 'third' }
        ]
      };
      const content = adapter.testExtractContent(response);
      expect(content).toBe('third');
    });
  });

  describe('extractStreamContent', () => {
    test('should extract stream content from chunk', () => {
      const chunk = {
        choices: [{
          delta: {
            content: 'Streaming text'
          }
        }]
      };
      
      const content = adapter.testExtractStreamContent(chunk);
      expect(content).toBe('Streaming text');
    });

    test('should fall back to extractContent when no stream location', () => {
      mockModel.messageStreamLocation = undefined;
      adapter = new TestAdapter(mockProvider, mockModel);
      
      const chunk = {
        choices: [{
          message: {
            content: 'Regular content'
          }
        }]
      };
      
      const content = adapter.testExtractStreamContent(chunk);
      expect(content).toBe('Regular content');
    });

    test('should handle error in stream extraction', () => {
      const chunk = null;
      const content = adapter.testExtractStreamContent(chunk);
      expect(content).toBe('');
    });
  });

  describe('extractUsage', () => {
    test('should extract usage information', () => {
      const response = {
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20
        }
      };
      
      const usage = adapter.testExtractUsage(response);
      expect(usage).toEqual({
        inputTokens: 10,
        outputTokens: 20,
        totalTokens: 30
      });
    });

    test('should handle missing usage paths', () => {
      mockModel.inputTokenCountLocation = undefined;
      mockModel.outputTokenCountLocation = undefined;
      adapter = new TestAdapter(mockProvider, mockModel);
      
      const response = { usage: {} };
      const usage = adapter.testExtractUsage(response);
      expect(usage).toEqual({
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0
      });
    });

    test('should handle partial usage data', () => {
      const response = {
        usage: {
          prompt_tokens: 15
        }
      };
      
      const usage = adapter.testExtractUsage(response);
      expect(usage).toEqual({
        inputTokens: 15,
        outputTokens: 0,
        totalTokens: 15
      });
    });

    test('should handle error in usage extraction', () => {
      const response = null;
      const usage = adapter.testExtractUsage(response);
      // Returns default values when response is null
      expect(usage).toEqual({
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0
      });
    });
  });

  describe('handleError', () => {
    test('should handle Error instances', () => {
      const error = new Error('Test error');
      const result = adapter.testHandleError(error);
      expect(result).toBe(error);
    });

    test('should handle string errors', () => {
      const error = 'String error';
      const result = adapter.testHandleError(error);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('String error');
    });

    test('should handle object with message property', () => {
      const error = { message: 'Object error' };
      const result = adapter.testHandleError(error);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Object error');
    });

    test('should handle unknown error types', () => {
      const error = { someField: 'value' };
      const result = adapter.testHandleError(error);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Unknown error occurred during AI communication');
    });

    test('should handle null error', () => {
      const result = adapter.testHandleError(null);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Unknown error occurred during AI communication');
    });
  });

  describe('validateApiKey', () => {
    test('should return true for valid API key', async () => {
      const isValid = await adapter.validateConfiguration();
      expect(isValid).toBe(true);
    });

    test('should return false for empty API key', async () => {
      mockProvider.secretKey = '';
      adapter = new TestAdapter(mockProvider, mockModel);
      const isValid = await adapter.validateConfiguration();
      expect(isValid).toBe(false);
    });

    test('should return false for whitespace-only API key', async () => {
      mockProvider.secretKey = '   ';
      adapter = new TestAdapter(mockProvider, mockModel);
      const isValid = await adapter.validateConfiguration();
      expect(isValid).toBe(false);
    });

    test('should return false for null API key', async () => {
      mockProvider.secretKey = null as any;
      adapter = new TestAdapter(mockProvider, mockModel);
      const isValid = await adapter.validateConfiguration();
      expect(isValid).toBe(false);
    });
  });

  describe('sendMessage', () => {
    test('should send message and return response', async () => {
      const messages: AIMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      const response = await adapter.sendMessage(messages, {});
      
      expect(response).toEqual({
        content: 'Test response',
        metadata: { tokensUsed: 10, model: 'test-model' },
      });
    });
  });

  describe('streamMessage', () => {
    test('should stream message chunks', async () => {
      const messages: AIMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      const chunks = [];
      for await (const chunk of adapter.streamMessage(messages, {})) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        type: 'content',
        data: { delta: 'Test stream' },
      });
    });
  });
});