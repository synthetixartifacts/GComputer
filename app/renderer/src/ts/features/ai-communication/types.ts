import type { Agent, Model, Provider } from '@features/admin/types';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
}

export interface CommunicationOptions {
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  additionalParams?: Record<string, any>;
}

export interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

export interface StreamEvent {
  type: 'chunk' | 'error' | 'complete';
  data?: string;
  error?: Error;
}

export interface ProviderAdapter {
  sendMessage(messages: AIMessage[], options: CommunicationOptions): Promise<AIResponse>;
  streamMessage(messages: AIMessage[], options: CommunicationOptions): AsyncIterableIterator<StreamEvent>;
  validateConfiguration(): Promise<boolean>;
}

export interface AgentContext {
  agent: Agent;
  model: Model;
  provider: Provider;
}

export interface ConversationState {
  agentId: number;
  messages: AIMessage[];
  isStreaming: boolean;
  currentResponse?: string;
  error?: string;
  usage?: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
  };
}

export interface ProviderConfiguration {
  authentication: 'bearer' | 'x-api-key' | 'custom';
  secretKey: string;
  url: string;
  configuration?: Record<string, any>;
}

export interface ModelConfiguration {
  endpoint: string;
  params: Record<string, any>;
  messageLocation: string;
  messageStreamLocation?: string;
  inputTokenCountLocation?: string;
  outputTokenCountLocation?: string;
}

export interface AgentConfiguration {
  systemPrompt: string;
  configuration?: Record<string, any>;
}

export type ProviderCode = 'openai' | 'anthropic' | 'custom';

export interface AICommunicationStore {
  conversations: Map<number, ConversationState>;
  activeConversation: number | null;
  isInitialized: boolean;
  error: string | null;
}