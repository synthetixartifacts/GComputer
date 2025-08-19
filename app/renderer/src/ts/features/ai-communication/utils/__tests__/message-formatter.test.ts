import { describe, test, expect } from 'vitest';
import { MessageFormatter } from '../message-formatter';
import type { AIMessage } from '../../types';

describe('Message Formatter Utils', () => {
  const mockMessages: AIMessage[] = [
    {
      role: 'user',
      content: 'Hello',
      metadata: { timestamp: Date.now() },
    },
    {
      role: 'assistant',
      content: 'Hi there!',
      metadata: { timestamp: Date.now() },
    },
  ];

  describe('formatMessagesForProvider', () => {
    test('should format messages for OpenAI', () => {
      const formatted = MessageFormatter.formatMessagesForProvider(mockMessages, 'openai');

      expect(formatted).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ]);
    });

    test('should format messages for Anthropic', () => {
      const messagesWithSystem: AIMessage[] = [
        { role: 'system', content: 'You are helpful', metadata: {} },
        ...mockMessages,
      ];

      const formatted = MessageFormatter.formatMessagesForProvider(messagesWithSystem, 'anthropic');

      expect(formatted).toEqual({
        system: 'You are helpful',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
      });
    });

    test('should handle empty messages array', () => {
      const formatted = MessageFormatter.formatMessagesForProvider([], 'openai');
      expect(formatted).toEqual([]);
    });

    test('should use default format for unknown provider', () => {
      const formatted = MessageFormatter.formatMessagesForProvider(mockMessages, 'unknown');
      expect(formatted).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ]);
    });
  });

  describe('validateMessage', () => {
    test('should validate correct message format', () => {
      const message: AIMessage = {
        role: 'user',
        content: 'Hello world',
        metadata: { timestamp: Date.now() },
      };

      const result = MessageFormatter.validateMessage(message);
      expect(result).toBe(true);
    });

    test('should reject invalid role', () => {
      const message = {
        role: 'invalid',
        content: 'Hello world',
        metadata: {},
      } as any;

      const result = MessageFormatter.validateMessage(message);
      expect(result).toBe(false);
    });

    test('should reject missing content', () => {
      const message = {
        role: 'user',
        metadata: {},
      } as any;

      const result = MessageFormatter.validateMessage(message);
      expect(result).toBe(false);
    });

    test('should reject non-string content', () => {
      const message = {
        role: 'user',
        content: 123,
        metadata: {},
      } as any;

      const result = MessageFormatter.validateMessage(message);
      expect(result).toBe(false);
    });

    test('should reject null or undefined message', () => {
      expect(MessageFormatter.validateMessage(null as any)).toBe(false);
      expect(MessageFormatter.validateMessage(undefined as any)).toBe(false);
    });
  });

  describe('sanitizeMessage', () => {
    test('should trim whitespace from content', () => {
      const message: AIMessage = {
        role: 'user',
        content: '   Hello world   ',
        metadata: { timestamp: Date.now() },
      };

      const sanitized = MessageFormatter.sanitizeMessage(message);
      expect(sanitized.content).toBe('Hello world');
      expect(sanitized.role).toBe('user');
    });

    test('should preserve metadata', () => {
      const message: AIMessage = {
        role: 'user',
        content: 'Hello',
        metadata: { timestamp: 123456 },
      };

      const sanitized = MessageFormatter.sanitizeMessage(message);
      expect(sanitized.metadata).toEqual({ timestamp: 123456 });
    });

    test('should handle missing metadata', () => {
      const message: AIMessage = {
        role: 'user',
        content: 'Hello',
      };

      const sanitized = MessageFormatter.sanitizeMessage(message);
      expect(sanitized.metadata).toBeUndefined();
    });
  });

  describe('formatForDisplay', () => {
    test('should return message content', () => {
      const message: AIMessage = {
        role: 'user',
        content: 'Hello world',
        metadata: {},
      };

      const display = MessageFormatter.formatForDisplay(message);
      expect(display).toBe('Hello world');
    });
  });

  describe('truncateMessage', () => {
    test('should truncate long messages', () => {
      const message: AIMessage = {
        role: 'user',
        content: 'This is a very long message that should be truncated',
        metadata: {},
      };

      const truncated = MessageFormatter.truncateMessage(message, 20);
      expect(truncated.content).toBe('This is a very long ...');
      expect(truncated.metadata.truncated).toBe(true);
      expect(truncated.metadata.originalLength).toBe(52);
    });

    test('should not truncate short messages', () => {
      const message: AIMessage = {
        role: 'user',
        content: 'Short',
        metadata: {},
      };

      const result = MessageFormatter.truncateMessage(message, 20);
      expect(result).toEqual(message);
    });
  });

  describe('addTimestamp', () => {
    test('should add timestamp to message', () => {
      const message: AIMessage = {
        role: 'user',
        content: 'Hello',
        metadata: {},
      };

      const withTimestamp = MessageFormatter.addTimestamp(message);
      expect(withTimestamp.metadata.timestamp).toBeTypeOf('number');
      expect(withTimestamp.metadata.timestamp).toBeGreaterThan(0);
    });
  });

  describe('removeMetadata', () => {
    test('should remove metadata from message', () => {
      const message: AIMessage = {
        role: 'user',
        content: 'Hello',
        metadata: { timestamp: Date.now(), other: 'data' },
      };

      const cleaned = MessageFormatter.removeMetadata(message);
      expect(cleaned).toEqual({
        role: 'user',
        content: 'Hello',
      });
    });
  });

  describe('estimateTokenCount', () => {
    test('should estimate token count for text', () => {
      const count = MessageFormatter.estimateTokenCount('Hello world this is a test');
      expect(count).toBeGreaterThan(0);
      expect(count).toBeTypeOf('number');
    });

    test('should handle empty text', () => {
      const count = MessageFormatter.estimateTokenCount('');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('limitConversationHistory', () => {
    test('should limit conversation history', () => {
      const messages: AIMessage[] = [
        { role: 'system', content: 'System prompt', metadata: {} },
        { role: 'user', content: 'Message 1', metadata: {} },
        { role: 'assistant', content: 'Response 1', metadata: {} },
        { role: 'user', content: 'Message 2', metadata: {} },
        { role: 'assistant', content: 'Response 2', metadata: {} },
      ];

      const limited = MessageFormatter.limitConversationHistory(messages, 3);
      expect(limited).toHaveLength(3);
      expect(limited[0].role).toBe('system');
      expect(limited[1].content).toBe('Message 2');
      expect(limited[2].content).toBe('Response 2');
    });

    test('should preserve all messages if under limit', () => {
      const messages: AIMessage[] = [
        { role: 'user', content: 'Message 1', metadata: {} },
        { role: 'assistant', content: 'Response 1', metadata: {} },
      ];

      const limited = MessageFormatter.limitConversationHistory(messages, 5);
      expect(limited).toEqual(messages);
    });
  });
});