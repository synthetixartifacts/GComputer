import type { AssistantReplyOptions, ChatMessage, SendMessageParams } from './types';
import { chatbotStore } from './store';

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
  if (!prompt || prompt.trim().length === 0) return 'Hello! How can I help you today?';
  if (/\bhello|hi|hey\b/i.test(prompt)) return 'Hi there! 👋 What would you like to explore?';
  if (/\bhelp|assist|support\b/i.test(prompt)) return 'Sure — tell me what you need help with.';
  return `You said: "${prompt}"`;
}

export function generateId(prefix: string = 'msg'): string {
  const random = Math.random().toString(36).slice(2, 8);
  const now = Date.now().toString(36);
  return `${prefix}_${now}_${random}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}


