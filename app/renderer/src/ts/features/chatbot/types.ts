export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAtIso: string;
}

export interface ChatThread {
  id: string;
  messages: ChatMessage[];
}

export interface SendMessageParams {
  threadId: string;
  content: string;
}

export interface AssistantReplyOptions {
  delayMs?: number;
}


