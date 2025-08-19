import { describe, test, expect, vi } from 'vitest';
import { ResponseParser } from '../response-parser';

describe('ResponseParser', () => {
  describe('parseJsonPath', () => {
    test('should parse simple path', () => {
      const obj = { field: 'value' };
      expect(ResponseParser.parseJsonPath(obj, 'field')).toBe('value');
    });

    test('should parse nested path', () => {
      const obj = { 
        level1: { 
          level2: { 
            level3: 'deep value' 
          } 
        } 
      };
      expect(ResponseParser.parseJsonPath(obj, 'level1.level2.level3')).toBe('deep value');
    });

    test('should parse array path with bracket notation', () => {
      const obj = {
        items: ['first', 'second', 'third']
      };
      expect(ResponseParser.parseJsonPath(obj, 'items[1]')).toBe('second');
    });

    test('should parse complex nested array path', () => {
      const obj = {
        choices: [{
          message: { content: 'Hello World' }
        }]
      };
      expect(ResponseParser.parseJsonPath(obj, 'choices[0].message.content')).toBe('Hello World');
    });

    test('should return null for non-existent path', () => {
      const obj = { field: 'value' };
      const result = ResponseParser.parseJsonPath(obj, 'nonexistent');
      expect(result === null || result === undefined).toBe(true);
    });

    test('should return null for invalid array index', () => {
      const obj = { items: ['one'] };
      const result = ResponseParser.parseJsonPath(obj, 'items[5]');
      expect(result === null || result === undefined).toBe(true);
    });

    test('should handle null object', () => {
      expect(ResponseParser.parseJsonPath(null, 'field')).toBeNull();
    });

    test('should handle undefined object', () => {
      expect(ResponseParser.parseJsonPath(undefined, 'field')).toBeNull();
    });

    test('should handle empty path', () => {
      const obj = { field: 'value' };
      expect(ResponseParser.parseJsonPath(obj, '')).toBeNull();
    });

    test('should handle multiple array indices', () => {
      const obj = {
        data: [
          { items: ['a', 'b'] },
          { items: ['c', 'd'] }
        ]
      };
      expect(ResponseParser.parseJsonPath(obj, 'data[1].items[0]')).toBe('c');
    });

    test('should handle invalid path parsing', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // Force an error by creating a circular reference that will fail to traverse
      const obj: any = {};
      obj.circular = obj;
      Object.defineProperty(obj, 'test', {
        get() { throw new Error('Forced error'); }
      });
      ResponseParser.parseJsonPath(obj, 'test.path');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('extractContent', () => {
    test('should extract string content', () => {
      const response = {
        choices: [{
          message: { content: 'Test content' }
        }]
      };
      const content = ResponseParser.extractContent(response, 'choices[0].message.content');
      expect(content).toBe('Test content');
    });

    test('should extract text from object with text property', () => {
      const response = {
        result: {
          text: 'Text content'
        }
      };
      const content = ResponseParser.extractContent(response, 'result');
      expect(content).toBe('Text content');
    });

    test('should return empty string for non-string content', () => {
      const response = {
        data: { value: 123 }
      };
      const content = ResponseParser.extractContent(response, 'data.value');
      expect(content).toBe('');
    });

    test('should return empty string for null path result', () => {
      const response = { field: 'value' };
      const content = ResponseParser.extractContent(response, 'nonexistent');
      expect(content).toBe('');
    });
  });

  describe('extractStreamContent', () => {
    test('should extract stream content', () => {
      const chunk = {
        choices: [{
          delta: { content: 'Stream text' }
        }]
      };
      const content = ResponseParser.extractStreamContent(chunk, 'choices[0].delta.content');
      expect(content).toBe('Stream text');
    });

    test('should return empty string for non-string stream content', () => {
      const chunk = {
        data: { value: true }
      };
      const content = ResponseParser.extractStreamContent(chunk, 'data.value');
      expect(content).toBe('');
    });

    test('should handle null chunk', () => {
      const content = ResponseParser.extractStreamContent(null, 'some.path');
      expect(content).toBe('');
    });
  });

  describe('extractUsage', () => {
    test('should extract usage with both input and output tokens', () => {
      const response = {
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200
        }
      };
      const usage = ResponseParser.extractUsage(
        response,
        'usage.prompt_tokens',
        'usage.completion_tokens'
      );
      expect(usage).toEqual({
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300
      });
    });

    test('should handle missing input tokens', () => {
      const response = {
        usage: {
          completion_tokens: 150
        }
      };
      const usage = ResponseParser.extractUsage(
        response,
        'usage.prompt_tokens',
        'usage.completion_tokens'
      );
      expect(usage).toEqual({
        inputTokens: 0,
        outputTokens: 150,
        totalTokens: 150
      });
    });

    test('should handle missing output tokens', () => {
      const response = {
        usage: {
          prompt_tokens: 75
        }
      };
      const usage = ResponseParser.extractUsage(
        response,
        'usage.prompt_tokens',
        'usage.completion_tokens'
      );
      expect(usage).toEqual({
        inputTokens: 75,
        outputTokens: 0,
        totalTokens: 75
      });
    });

    test('should return defaults when no locations provided', () => {
      const response = { usage: {} };
      const usage = ResponseParser.extractUsage(response);
      expect(usage).toEqual({
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0
      });
    });

    test('should return undefined when both tokens are null', () => {
      const response = {};
      const usage = ResponseParser.extractUsage(
        response,
        'usage.prompt_tokens',
        'usage.completion_tokens'
      );
      expect(usage).toBeUndefined();
    });

    test('should handle error during extraction', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // Create an object that will throw an error when accessed
      const response: any = {};
      Object.defineProperty(response, 'usage', {
        get() { throw new Error('Forced error'); }
      });
      const usage = ResponseParser.extractUsage(response, 'usage.input', 'usage.output');
      expect(usage).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('parseStreamChunk', () => {
    test('should parse OpenAI stream chunk', () => {
      const chunk = 'data: {"choices":[{"delta":{"content":"Hello"}}]}';
      const parsed = ResponseParser.parseStreamChunk(chunk, 'openai');
      expect(parsed).toEqual({
        choices: [{
          delta: { content: 'Hello' }
        }]
      });
    });

    test('should handle OpenAI [DONE] message', () => {
      const chunk = 'data: [DONE]';
      const parsed = ResponseParser.parseStreamChunk(chunk, 'openai');
      expect(parsed).toEqual({ done: true });
    });

    test('should parse Anthropic stream chunk', () => {
      const chunk = 'data: {"type":"content_block_delta","delta":{"text":"Hi"}}';
      const parsed = ResponseParser.parseStreamChunk(chunk, 'anthropic');
      expect(parsed).toEqual({
        type: 'content_block_delta',
        delta: { text: 'Hi' }
      });
    });

    test('should return null for non-data chunk', () => {
      const chunk = 'event: message';
      const parsed = ResponseParser.parseStreamChunk(chunk);
      expect(parsed).toBeNull();
    });

    test('should handle invalid JSON', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const chunk = 'data: invalid json';
      const parsed = ResponseParser.parseStreamChunk(chunk);
      expect(parsed).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should handle empty chunk', () => {
      const parsed = ResponseParser.parseStreamChunk('');
      expect(parsed).toBeNull();
    });
  });

  describe('formatError', () => {
    test('should format Error instance', () => {
      const error = new Error('Test error message');
      expect(ResponseParser.formatError(error)).toBe('Test error message');
    });

    test('should format string error', () => {
      const error = 'String error';
      expect(ResponseParser.formatError(error)).toBe('String error');
    });

    test('should format object with error.message', () => {
      const error = { error: { message: 'Nested error message' } };
      expect(ResponseParser.formatError(error)).toBe('Nested error message');
    });

    test('should format object with message', () => {
      const error = { message: 'Simple message' };
      expect(ResponseParser.formatError(error)).toBe('Simple message');
    });

    test('should return default message for unknown error type', () => {
      const error = { someField: 'value' };
      expect(ResponseParser.formatError(error)).toBe('Unknown error occurred');
    });

    test('should handle null error', () => {
      expect(ResponseParser.formatError(null)).toBe('Unknown error occurred');
    });

    test('should handle undefined error', () => {
      expect(ResponseParser.formatError(undefined)).toBe('Unknown error occurred');
    });
  });

  describe('parseErrorResponse', () => {
    test('should parse string error field', () => {
      const response = { error: 'Error occurred' };
      expect(ResponseParser.parseErrorResponse(response)).toBe('Error occurred');
    });

    test('should parse error with message field', () => {
      const response = { 
        error: { 
          message: 'API error message' 
        } 
      };
      expect(ResponseParser.parseErrorResponse(response)).toBe('API error message');
    });

    test('should parse error with type and code', () => {
      const response = { 
        error: { 
          type: 'invalid_request', 
          code: 'missing_parameter' 
        } 
      };
      expect(ResponseParser.parseErrorResponse(response)).toBe('invalid_request: missing_parameter');
    });

    test('should parse response with message field', () => {
      const response = { message: 'Response message' };
      expect(ResponseParser.parseErrorResponse(response)).toBe('Response message');
    });

    test('should return default message for empty response', () => {
      const response = {};
      expect(ResponseParser.parseErrorResponse(response)).toBe('API request failed');
    });

    test('should handle parsing error', () => {
      const response = null;
      expect(ResponseParser.parseErrorResponse(response)).toBe('API request failed');
    });
  });

  describe('validateResponse', () => {
    test('should validate response with all expected paths', () => {
      const response = {
        choices: [{
          message: { content: 'Hello' }
        }],
        usage: {
          total_tokens: 10
        }
      };
      const isValid = ResponseParser.validateResponse(response, [
        'choices[0].message.content',
        'usage.total_tokens'
      ]);
      expect(isValid).toBe(true);
    });

    test('should return false when path is missing', () => {
      const response = {
        choices: [{
          message: { content: 'Hello' }
        }]
      };
      const isValid = ResponseParser.validateResponse(response, [
        'choices[0].message.content',
        'usage.total_tokens'
      ]);
      expect(isValid).toBe(false);
    });

    test('should return false for null values', () => {
      const response = {
        choices: [{
          message: { content: null }
        }]
      };
      const isValid = ResponseParser.validateResponse(response, [
        'choices[0].message.content'
      ]);
      expect(isValid).toBe(false);
    });

    test('should return false for undefined values', () => {
      const response = {
        choices: [{}]
      };
      const isValid = ResponseParser.validateResponse(response, [
        'choices[0].message.content'
      ]);
      expect(isValid).toBe(false);
    });

    test('should handle empty paths array', () => {
      const response = { data: 'value' };
      const isValid = ResponseParser.validateResponse(response, []);
      expect(isValid).toBe(true);
    });

    test('should handle error during validation', () => {
      const response = null;
      const isValid = ResponseParser.validateResponse(response, ['some.path']);
      expect(isValid).toBe(false);
    });
  });

  describe('normalizeResponse', () => {
    test('should normalize OpenAI response', () => {
      const response = {
        id: 'chatcmpl-123',
        model: 'gpt-4',
        created: 1234567890,
        choices: [{
          message: { content: 'OpenAI response' },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      };
      
      const normalized = ResponseParser.normalizeResponse(response, 'openai');
      expect(normalized).toEqual({
        content: 'OpenAI response',
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        },
        metadata: {
          model: 'gpt-4',
          id: 'chatcmpl-123',
          created: 1234567890,
          finishReason: 'stop'
        }
      });
    });

    test('should normalize Anthropic response', () => {
      const response = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        model: 'claude-3',
        content: [{
          text: 'Anthropic response'
        }],
        usage: {
          input_tokens: 15,
          output_tokens: 25
        },
        stop_reason: 'end_turn'
      };
      
      const normalized = ResponseParser.normalizeResponse(response, 'anthropic');
      expect(normalized).toEqual({
        content: 'Anthropic response',
        usage: {
          input_tokens: 15,
          output_tokens: 25
        },
        metadata: {
          model: 'claude-3',
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          stopReason: 'end_turn'
        }
      });
    });

    test('should return original response for unknown provider', () => {
      const response = { data: 'unknown' };
      const normalized = ResponseParser.normalizeResponse(response, 'unknown');
      expect(normalized).toEqual(response);
    });

    test('should handle missing fields in OpenAI response', () => {
      const response = {};
      const normalized = ResponseParser.normalizeResponse(response, 'openai');
      expect(normalized).toEqual({
        content: '',
        usage: undefined,
        metadata: {
          model: undefined,
          id: undefined,
          created: undefined,
          finishReason: undefined
        }
      });
    });

    test('should handle missing fields in Anthropic response', () => {
      const response = {};
      const normalized = ResponseParser.normalizeResponse(response, 'anthropic');
      expect(normalized).toEqual({
        content: '',
        usage: undefined,
        metadata: {
          model: undefined,
          id: undefined,
          type: undefined,
          role: undefined,
          stopReason: undefined
        }
      });
    });
  });
});