// Discussion feature exports
export * from './types';
export { discussionService } from './service';
export { 
  discussionStore,
  activeDiscussion,
  currentMessages,
  discussions,
  favoriteDiscussions,
  isLoading,
  error,
} from './store';