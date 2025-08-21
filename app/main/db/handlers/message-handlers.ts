import { ipcMain } from 'electron';
import { messageService } from '../services/index.js';
import type { MessageFilters, MessageInsert } from '../services/message-service.js';

export function registerMessageHandlers(): void {
  // List messages with filters
  ipcMain.handle('db:messages:list', async (_event, filters?: MessageFilters) => {
    try {
      return await messageService.list(filters);
    } catch (error) {
      console.error('Error listing messages:', error);
      throw error;
    }
  });

  // Create a new message
  ipcMain.handle('db:messages:create', async (_event, payload: MessageInsert) => {
    try {
      return await messageService.createForDiscussion(payload);
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  });

  // Get messages by discussion
  ipcMain.handle('db:messages:getByDiscussion', async (_event, discussionId: number) => {
    try {
      return await messageService.getByDiscussion(discussionId);
    } catch (error) {
      console.error('Error getting messages by discussion:', error);
      throw error;
    }
  });

  // Get last N messages from discussion
  ipcMain.handle('db:messages:getLastMessages', async (_event, discussionId: number, limit?: number) => {
    try {
      return await messageService.getLastMessages(discussionId, limit);
    } catch (error) {
      console.error('Error getting last messages:', error);
      throw error;
    }
  });

  // Count messages in discussion
  ipcMain.handle('db:messages:countByDiscussion', async (_event, discussionId: number) => {
    try {
      return await messageService.countByDiscussion(discussionId);
    } catch (error) {
      console.error('Error counting messages:', error);
      throw error;
    }
  });

  // Delete all messages for a discussion
  ipcMain.handle('db:messages:deleteByDiscussion', async (_event, discussionId: number) => {
    try {
      await messageService.deleteByDiscussion(discussionId);
      return { ok: true };
    } catch (error) {
      console.error('Error deleting messages by discussion:', error);
      throw error;
    }
  });
}