import { ipcMain } from 'electron';
import { discussionService } from '../services/index.js';
import type { DiscussionFilters, DiscussionInsert, DiscussionUpdate } from '../services/discussion-service.js';

export function registerDiscussionHandlers(): void {
  // List discussions with filters
  ipcMain.handle('db:discussions:list', async (_event, filters?: DiscussionFilters) => {
    try {
      return await discussionService.list(filters);
    } catch (error) {
      console.error('Error listing discussions:', error);
      throw error;
    }
  });

  // Create a new discussion
  ipcMain.handle('db:discussions:create', async (_event, payload: DiscussionInsert) => {
    try {
      return await discussionService.create(payload);
    } catch (error) {
      console.error('Error creating discussion:', error);
      throw error;
    }
  });

  // Update a discussion
  ipcMain.handle('db:discussions:update', async (_event, payload: DiscussionUpdate) => {
    try {
      return await discussionService.update(payload);
    } catch (error) {
      console.error('Error updating discussion:', error);
      throw error;
    }
  });

  // Delete a discussion
  ipcMain.handle('db:discussions:delete', async (_event, id: number) => {
    try {
      return await discussionService.delete(id);
    } catch (error) {
      console.error('Error deleting discussion:', error);
      throw error;
    }
  });

  // Get discussion with messages
  ipcMain.handle('db:discussions:getWithMessages', async (_event, discussionId: number) => {
    try {
      return await discussionService.getWithMessages(discussionId);
    } catch (error) {
      console.error('Error getting discussion with messages:', error);
      throw error;
    }
  });

  // Toggle favorite status
  ipcMain.handle('db:discussions:toggleFavorite', async (_event, discussionId: number) => {
    try {
      return await discussionService.toggleFavorite(discussionId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  });
}