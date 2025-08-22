import { writable, derived } from 'svelte/store';
import type { DiscussionState, Discussion, Message, DiscussionWithMessages } from './types';

// Initial state
const initialState: DiscussionState = {
  discussions: [],
  activeDiscussion: null,
  currentMessages: [],
  isLoading: false,
  error: null,
  filters: {},
};

// Create the writable store
function createDiscussionStore() {
  const { subscribe, set, update } = writable<DiscussionState>(initialState);

  return {
    subscribe,
    
    // Set all discussions
    setDiscussions(discussions: Discussion[]) {
      update(state => ({
        ...state,
        discussions,
        error: null,
      }));
    },

    // Set active discussion
    setActiveDiscussion(discussion: DiscussionWithMessages | null) {
      update(state => ({
        ...state,
        activeDiscussion: discussion,
        currentMessages: discussion?.messages || [],
        error: null,
      }));
    },

    // Add a message to current discussion
    addMessage(message: Message) {
      update(state => {
        if (!state.activeDiscussion) return state;

        const updatedMessages = [...state.currentMessages, message];
        
        return {
          ...state,
          currentMessages: updatedMessages,
          activeDiscussion: {
            ...state.activeDiscussion,
            messages: updatedMessages,
            updatedAt: new Date(),
          },
        };
      });
    },

    // Update a message (useful for streaming)
    updateMessage(messageId: number, content: string) {
      update(state => {
        const updatedMessages = state.currentMessages.map(msg =>
          msg.id === messageId ? { ...msg, content } : msg
        );

        if (!state.activeDiscussion) return state;

        return {
          ...state,
          currentMessages: updatedMessages,
          activeDiscussion: {
            ...state.activeDiscussion,
            messages: updatedMessages,
          },
        };
      });
    },

    // Add a temporary message (for streaming before it's saved)
    addTempMessage(who: 'user' | 'agent', content: string) {
      update(state => {
        const tempMessage: Message = {
          id: -Date.now(), // Negative ID for temp messages
          who,
          content,
          discussionId: state.activeDiscussion?.id || 0,
          createdAt: new Date(),
        };

        return {
          ...state,
          currentMessages: [...state.currentMessages, tempMessage],
        };
      });
    },

    // Replace temp message with real one
    replaceTempMessage(tempId: number, realMessage: Message) {
      update(state => {
        const updatedMessages = state.currentMessages.map(msg =>
          msg.id === tempId ? realMessage : msg
        );

        if (!state.activeDiscussion) return state;

        return {
          ...state,
          currentMessages: updatedMessages,
          activeDiscussion: {
            ...state.activeDiscussion,
            messages: updatedMessages,
          },
        };
      });
    },

    // Update discussion in list
    updateDiscussionInList(discussion: Discussion) {
      update(state => ({
        ...state,
        discussions: state.discussions.map(d =>
          d.id === discussion.id ? discussion : d
        ),
      }));
    },

    // Remove discussion from list
    removeDiscussionFromList(discussionId: number) {
      update(state => ({
        ...state,
        discussions: state.discussions.filter(d => d.id !== discussionId),
        activeDiscussion: state.activeDiscussion?.id === discussionId ? null : state.activeDiscussion,
      }));
    },

    // Set filters
    setFilters(filters: DiscussionState['filters']) {
      update(state => ({
        ...state,
        filters,
      }));
    },

    // Set loading state
    setLoading(isLoading: boolean) {
      update(state => ({
        ...state,
        isLoading,
      }));
    },

    // Set error
    setError(error: string | null) {
      update(state => ({
        ...state,
        error,
        isLoading: false,
      }));
    },

    // Clear active discussion
    clearActiveDiscussion() {
      update(state => ({
        ...state,
        activeDiscussion: null,
        currentMessages: [],
      }));
    },

    // Reset store
    reset() {
      set(initialState);
    },
  };
}

// Create the store instance
export const discussionStore = createDiscussionStore();

// Derived stores for common use cases
export const activeDiscussion = derived(
  discussionStore,
  $store => $store.activeDiscussion
);

export const currentMessages = derived(
  discussionStore,
  $store => $store.currentMessages
);

export const discussions = derived(
  discussionStore,
  $store => $store.discussions
);

export const favoriteDiscussions = derived(
  discussionStore,
  $store => $store.discussions.filter(d => d.isFavorite)
);

export const isLoading = derived(
  discussionStore,
  $store => $store.isLoading
);

export const error = derived(
  discussionStore,
  $store => $store.error
);