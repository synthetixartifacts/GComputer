import type { Agent } from '@features/admin/types';

export interface Discussion {
  id: number;
  title: string;
  isFavorite: boolean;
  agentId: number;
  agent?: {
    id: number;
    name: string;
    code: string;
    description: string;
    systemPrompt?: string;
    configuration?: string;
    modelId?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: number;
  who: 'user' | 'agent';
  content: string;
  discussionId: number;
  createdAt: Date;
}

export interface DiscussionWithMessages extends Discussion {
  messages: Message[];
}

export interface DiscussionFilters {
  isFavorite?: boolean;
  agentId?: number;
  search?: string;
}

export interface MessageFilters {
  discussionId?: number;
  who?: 'user' | 'agent';
}

export interface CreateDiscussionPayload {
  title?: string;
  isFavorite?: boolean;
  agentId: number;
}

export interface UpdateDiscussionPayload {
  id: number;
  title?: string;
  isFavorite?: boolean;
  agentId?: number;
}

export interface CreateMessagePayload {
  who: 'user' | 'agent';
  content: string;
  discussionId: number;
}

export interface DiscussionState {
  discussions: Discussion[];
  activeDiscussion: DiscussionWithMessages | null;
  currentMessages: Message[];
  isLoading: boolean;
  error: string | null;
  filters: DiscussionFilters;
}

export interface MessageStream {
  discussionId: number;
  content: string;
  isComplete: boolean;
}