import type { AssistantReplyOptions, ChatMessage, SendMessageParams } from './types';
import { chatbotStore } from './store';
import { generateId } from '@ts/shared/utils/id-generation';
import { nowIso } from '@ts/shared/utils/formatting';

/**
 * IO boundary for chatbot interactions. For v1 this only simulates a reply.
 */
export async function sendMessage(
  params: SendMessageParams,
  options: AssistantReplyOptions = {}
): Promise<void> {
  const { threadId, content } = params;
  chatbotStore.addUserMessage(threadId, content);

  const delayMs = typeof options.delayMs === 'number' ? options.delayMs : 600;
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  const replyContent = simulateAssistantReply(content);
  chatbotStore.addAssistantMessage(threadId, replyContent);
}

function simulateAssistantReply(prompt: string): string {
  // Note: These are placeholder responses for simulation purposes
  // Real implementation will use AI service responses
  if (!prompt || prompt.trim().length === 0) return '__greeting__';
  if (/\bhello|hi|hey\b/i.test(prompt)) return '__hello__';
  if (/\bhelp|assist|support\b/i.test(prompt)) return '__help__';
  return `You said: "${prompt}"`;
}

// Re-export shared utilities for backward compatibility
export { generateId, nowIso };


