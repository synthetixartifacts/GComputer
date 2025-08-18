import type { AIMessage } from '../types';

export class MessageFormatter {
  static formatForDisplay(message: AIMessage): string {
    return message.content;
  }

  static truncateMessage(message: AIMessage, maxLength: number): AIMessage {
    if (message.content.length <= maxLength) {
      return message;
    }

    return {
      ...message,
      content: message.content.substring(0, maxLength) + '...',
      metadata: {
        ...message.metadata,
        truncated: true,
        originalLength: message.content.length
      }
    };
  }

  static limitConversationHistory(messages: AIMessage[], maxMessages: number): AIMessage[] {
    if (messages.length <= maxMessages) {
      return messages;
    }

    const systemMessages = messages.filter(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');
    
    const limitedConversation = conversationMessages.slice(-maxMessages + systemMessages.length);
    
    return [...systemMessages, ...limitedConversation];
  }

  static estimateTokenCount(text: string): number {
    const words = text.split(/\s+/).length;
    return Math.ceil(words * 1.3);
  }

  static formatMessagesForProvider(messages: AIMessage[], providerCode: string): any {
    switch (providerCode) {
      case 'openai':
        return this.formatForOpenAI(messages);
      case 'anthropic':
        return this.formatForAnthropic(messages);
      default:
        return messages.map(m => ({ role: m.role, content: m.content }));
    }
  }

  private static formatForOpenAI(messages: AIMessage[]): any[] {
    return messages.map(message => ({
      role: message.role,
      content: message.content
    }));
  }

  private static formatForAnthropic(messages: AIMessage[]): { messages: any[], system?: string } {
    let systemMessage: string | undefined;
    const conversationMessages: any[] = [];
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        if (systemMessage) {
          systemMessage += '\n\n' + msg.content;
        } else {
          systemMessage = msg.content;
        }
      } else {
        conversationMessages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }
    
    return {
      messages: conversationMessages,
      system: systemMessage
    };
  }

  static addTimestamp(message: AIMessage): AIMessage {
    return {
      ...message,
      metadata: {
        ...message.metadata,
        timestamp: Date.now()
      }
    };
  }

  static removeMetadata(message: AIMessage): AIMessage {
    return {
      role: message.role,
      content: message.content
    };
  }

  static validateMessage(message: AIMessage): boolean {
    if (!message || typeof message !== 'object') {
      return false;
    }

    if (!['system', 'user', 'assistant'].includes(message.role)) {
      return false;
    }

    if (typeof message.content !== 'string') {
      return false;
    }

    return true;
  }

  static sanitizeMessage(message: AIMessage): AIMessage {
    return {
      role: message.role,
      content: message.content.trim(),
      metadata: message.metadata ? { ...message.metadata } : undefined
    };
  }
}