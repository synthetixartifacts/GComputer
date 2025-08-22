import type { Message } from './types';
import type { AIMessage } from '@features/ai-communication/types';

/**
 * Prepare AI messages with conversation history if memory is enabled
 * @param currentMessage - The new message to send
 * @param previousMessages - Previous messages in the conversation
 * @param useMemory - Whether to include conversation history
 * @returns Array of AI messages formatted for the AI service
 */
export function prepareAIMessages(
  currentMessage: string,
  previousMessages: Message[],
  useMemory: boolean
): AIMessage[] {
  const aiMessages: AIMessage[] = [];
  
  // Only include conversation history if memory is enabled AND we have previous messages
  // Filter to only user/agent messages (no system messages)
  const historyMessages = previousMessages.filter(
    msg => msg.who === 'user' || msg.who === 'agent'
  );
  
  if (useMemory && historyMessages.length > 0) {
    // Build conversation history
    const historyLines: string[] = [];
    historyLines.push('<conversation_history>');
    
    historyMessages.forEach(msg => {
      const role = msg.who === 'user' ? '## User' : '## AI Agent';
      historyLines.push(role);
      historyLines.push(msg.content);
      historyLines.push('');
    });
    
    historyLines.push('</conversation_history>');
    historyLines.push('');
    historyLines.push('# New User message to answer to');
    historyLines.push(currentMessage);
    
    aiMessages.push({
      role: 'user',
      content: historyLines.join('\n')
    });
  } else {
    // No history or memory disabled - just send the current message
    aiMessages.push({
      role: 'user',
      content: currentMessage
    });
  }
  
  return aiMessages;
}

/**
 * UI Constants for discussion components
 */
export const DISCUSSION_UI = {
  // Scroll thresholds
  SCROLL_BOTTOM_THRESHOLD: 50, // px from bottom to consider "at bottom"
  
  // Input sizing
  INPUT_MAX_HEIGHT: 200, // Maximum height for auto-expanding textarea
  INPUT_MIN_HEIGHT: 60,  // Minimum height for textarea
  
  // Animation durations
  SCROLL_ANIMATION_DURATION: 300, // ms for smooth scroll
  
  // Message limits
  MAX_MESSAGE_LENGTH: 10000, // Maximum characters per message
  
  // Debounce timings
  TYPING_DEBOUNCE: 500, // ms to wait before showing "typing" indicator
} as const;

/**
 * Error handling utilities
 */
export class DiscussionError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'DiscussionError';
  }
  
  static from(error: unknown): DiscussionError {
    if (error instanceof DiscussionError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new DiscussionError(error.message, undefined, error);
    }
    
    return new DiscussionError(
      typeof error === 'string' ? error : 'Unknown error occurred',
      'UNKNOWN_ERROR',
      error
    );
  }
}