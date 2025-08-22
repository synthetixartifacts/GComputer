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

// Discussion operations via Electron IPC
export async function listDiscussions(filters?: DiscussionFilters): Promise<Discussion[]> {
  return window.gc.db.discussions.list(filters);
}

export async function createDiscussion(payload: CreateDiscussionPayload): Promise<Discussion> {
  const discussion = await window.gc.db.discussions.create(payload);
  if (!discussion) {
    throw new Error('Failed to create discussion');
  }
  return discussion;
}

export async function updateDiscussion(payload: UpdateDiscussionPayload): Promise<Discussion> {
  const discussion = await window.gc.db.discussions.update(payload);
  if (!discussion) {
    throw new Error('Failed to update discussion');
  }
  return discussion;
}

export async function deleteDiscussion(id: number): Promise<void> {
  await window.gc.db.discussions.delete(id);
}

export async function getDiscussionWithMessages(discussionId: number): Promise<DiscussionWithMessages | null> {
  return window.gc.db.discussions.getWithMessages(discussionId);
}

export async function toggleFavorite(discussionId: number): Promise<Discussion> {
  const discussion = await window.gc.db.discussions.toggleFavorite(discussionId);
  if (!discussion) {
    throw new Error('Failed to toggle favorite');
  }
  return discussion;
}

// Message operations via Electron IPC
export async function listMessages(filters?: MessageFilters): Promise<Message[]> {
  return window.gc.db.messages.list(filters);
}

export async function createMessage(payload: CreateMessagePayload): Promise<Message> {
  const message = await window.gc.db.messages.create(payload);
  if (!message) {
    throw new Error('Failed to create message');
  }
  return message;
}

export async function getMessagesByDiscussion(discussionId: number): Promise<Message[]> {
  return window.gc.db.messages.getByDiscussion(discussionId);
}

export async function getLastMessages(discussionId: number, limit?: number): Promise<Message[]> {
  return window.gc.db.messages.getLastMessages(discussionId, limit);
}

export async function countMessages(discussionId: number): Promise<number> {
  return window.gc.db.messages.countByDiscussion(discussionId);
}

export async function deleteMessagesByDiscussion(discussionId: number): Promise<void> {
  await window.gc.db.messages.deleteByDiscussion(discussionId);
}