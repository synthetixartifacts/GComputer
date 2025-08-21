import type {
  Discussion,
  Message,
  DiscussionWithMessages,
  DiscussionFilters,
  MessageFilters,
  CreateDiscussionPayload,
  UpdateDiscussionPayload,
  CreateMessagePayload,
} from './types';

const API_BASE_URL = 'http://localhost:3001/api';

// Discussion operations via REST API
export async function listDiscussions(filters?: DiscussionFilters): Promise<Discussion[]> {
  const params = filters ? new URLSearchParams(filters as any).toString() : '';
  const response = await fetch(`${API_BASE_URL}/discussions${params ? `?${params}` : ''}`);
  if (!response.ok) throw new Error('Failed to list discussions');
  return response.json();
}

export async function createDiscussion(payload: CreateDiscussionPayload): Promise<Discussion> {
  const response = await fetch(`${API_BASE_URL}/discussions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to create discussion');
  return response.json();
}

export async function updateDiscussion(payload: UpdateDiscussionPayload): Promise<Discussion> {
  const response = await fetch(`${API_BASE_URL}/discussions/${payload.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to update discussion');
  return response.json();
}

export async function deleteDiscussion(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/discussions/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete discussion');
}

export async function getDiscussionWithMessages(discussionId: number): Promise<DiscussionWithMessages | null> {
  const response = await fetch(`${API_BASE_URL}/discussions/${discussionId}/with-messages`);
  if (!response.ok) return null;
  return response.json();
}

export async function toggleFavorite(discussionId: number): Promise<Discussion> {
  const response = await fetch(`${API_BASE_URL}/discussions/${discussionId}/favorite`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to toggle favorite');
  return response.json();
}

// Message operations via REST API
export async function listMessages(filters?: MessageFilters): Promise<Message[]> {
  const params = filters ? new URLSearchParams(filters as any).toString() : '';
  const response = await fetch(`${API_BASE_URL}/messages${params ? `?${params}` : ''}`);
  if (!response.ok) throw new Error('Failed to list messages');
  return response.json();
}

export async function createMessage(payload: CreateMessagePayload): Promise<Message> {
  const response = await fetch(`${API_BASE_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to create message');
  return response.json();
}

export async function getMessagesByDiscussion(discussionId: number): Promise<Message[]> {
  const response = await fetch(`${API_BASE_URL}/messages/discussion/${discussionId}`);
  if (!response.ok) throw new Error('Failed to get messages');
  return response.json();
}

export async function getLastMessages(discussionId: number, limit?: number): Promise<Message[]> {
  const params = limit ? `?limit=${limit}` : '';
  const response = await fetch(`${API_BASE_URL}/messages/discussion/${discussionId}/last${params}`);
  if (!response.ok) throw new Error('Failed to get last messages');
  return response.json();
}

export async function countMessages(discussionId: number): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/messages/discussion/${discussionId}/count`);
  if (!response.ok) throw new Error('Failed to count messages');
  const data = await response.json();
  return data.count;
}

export async function deleteMessagesByDiscussion(discussionId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/messages/discussion/${discussionId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete messages');
}