import { writable, derived, get } from 'svelte/store';
import type { 
  AICommunicationStore, 
  ConversationState, 
  AIMessage, 
  AgentContext 
} from './types';

function createAICommunicationStore() {
  const initialState: AICommunicationStore = {
    conversations: new Map(),
    activeConversation: null,
    isInitialized: false,
    error: null
  };

  const { subscribe, set, update } = writable<AICommunicationStore>(initialState);

  return {
    subscribe,
    
    initialize: () => {
      update(state => ({ 
        ...state, 
        isInitialized: true,
        error: null 
      }));
    },

    setError: (error: string | null) => {
      update(state => ({ ...state, error }));
    },

    createConversation: (agentId: number, agentContext?: AgentContext) => {
      update(state => {
        const conversation: ConversationState = {
          agentId,
          messages: [],
          isStreaming: false,
          usage: {
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalTokens: 0
          }
        };
        
        const newConversations = new Map(state.conversations);
        newConversations.set(agentId, conversation);
        
        return {
          ...state,
          conversations: newConversations,
          activeConversation: agentId
        };
      });
    },

    setActiveConversation: (agentId: number | null) => {
      update(state => ({ ...state, activeConversation: agentId }));
    },

    addMessage: (agentId: number, message: AIMessage) => {
      update(state => {
        const newConversations = new Map(state.conversations);
        const conversation = newConversations.get(agentId);
        
        if (conversation) {
          conversation.messages.push(message);
          newConversations.set(agentId, conversation);
        }
        
        return { ...state, conversations: newConversations };
      });
    },

    startStreaming: (agentId: number) => {
      update(state => {
        const newConversations = new Map(state.conversations);
        const conversation = newConversations.get(agentId);
        
        if (conversation) {
          conversation.isStreaming = true;
          conversation.currentResponse = '';
          conversation.error = undefined;
          newConversations.set(agentId, conversation);
        }
        
        return { ...state, conversations: newConversations };
      });
    },

    appendStreamContent: (agentId: number, content: string) => {
      update(state => {
        const newConversations = new Map(state.conversations);
        const conversation = newConversations.get(agentId);
        
        if (conversation) {
          conversation.currentResponse = (conversation.currentResponse || '') + content;
          newConversations.set(agentId, conversation);
        }
        
        return { ...state, conversations: newConversations };
      });
    },

    completeStreaming: (agentId: number, finalContent?: string) => {
      update(state => {
        const newConversations = new Map(state.conversations);
        const conversation = newConversations.get(agentId);
        
        if (conversation) {
          const responseContent = finalContent || conversation.currentResponse || '';
          
          if (responseContent) {
            conversation.messages.push({
              role: 'assistant',
              content: responseContent,
              metadata: { timestamp: Date.now() }
            });
          }
          
          conversation.isStreaming = false;
          conversation.currentResponse = undefined;
          conversation.error = undefined;
          newConversations.set(agentId, conversation);
        }
        
        return { ...state, conversations: newConversations };
      });
    },

    setStreamingError: (agentId: number, error: string) => {
      update(state => {
        const newConversations = new Map(state.conversations);
        const conversation = newConversations.get(agentId);
        
        if (conversation) {
          conversation.isStreaming = false;
          conversation.currentResponse = undefined;
          conversation.error = error;
          newConversations.set(agentId, conversation);
        }
        
        return { ...state, conversations: newConversations };
      });
    },

    updateUsage: (agentId: number, inputTokens: number, outputTokens: number) => {
      update(state => {
        const newConversations = new Map(state.conversations);
        const conversation = newConversations.get(agentId);
        
        if (conversation && conversation.usage) {
          conversation.usage.totalInputTokens += inputTokens;
          conversation.usage.totalOutputTokens += outputTokens;
          conversation.usage.totalTokens += inputTokens + outputTokens;
          newConversations.set(agentId, conversation);
        }
        
        return { ...state, conversations: newConversations };
      });
    },

    deleteConversation: (agentId: number) => {
      update(state => {
        const newConversations = new Map(state.conversations);
        newConversations.delete(agentId);
        
        return {
          ...state,
          conversations: newConversations,
          activeConversation: state.activeConversation === agentId ? null : state.activeConversation
        };
      });
    },

    clearAllConversations: () => {
      update(state => ({
        ...state,
        conversations: new Map(),
        activeConversation: null
      }));
    },

    getConversation: (agentId: number): ConversationState | undefined => {
      const state = get({ subscribe });
      return state.conversations.get(agentId);
    },

    reset: () => {
      set(initialState);
    }
  };
}

export const aiCommunicationStore = createAICommunicationStore();

export const activeConversation = derived(
  aiCommunicationStore,
  $store => $store.activeConversation !== null 
    ? $store.conversations.get($store.activeConversation) 
    : undefined
);

export const conversationsList = derived(
  aiCommunicationStore,
  $store => Array.from($store.conversations.values())
);

export const isAnyStreaming = derived(
  aiCommunicationStore,
  $store => Array.from($store.conversations.values()).some(conv => conv.isStreaming)
);

export const totalUsage = derived(
  aiCommunicationStore,
  $store => {
    const conversations = Array.from($store.conversations.values());
    return conversations.reduce(
      (total, conv) => ({
        totalInputTokens: total.totalInputTokens + (conv.usage?.totalInputTokens || 0),
        totalOutputTokens: total.totalOutputTokens + (conv.usage?.totalOutputTokens || 0),
        totalTokens: total.totalTokens + (conv.usage?.totalTokens || 0)
      }),
      { totalInputTokens: 0, totalOutputTokens: 0, totalTokens: 0 }
    );
  }
);