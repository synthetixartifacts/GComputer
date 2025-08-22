import { writable, derived, get } from 'svelte/store';
import type { DiscussionWithMessages, Message } from './types';
import type { Agent } from '@features/admin/types';
import type { ChatMessage } from '@features/chatbot/types';
import { discussionService } from './service';
import { chatbotStore } from '@features/chatbot/store';

export interface DiscussionState {
  // Current discussion
  activeDiscussion: DiscussionWithMessages | null;
  activeAgent: Agent | null;
  
  // UI state
  isLoading: boolean;
  isStreaming: boolean;
  isSaving: boolean;
  
  // Messages state
  messages: Message[];
  userMessageCount: number;
  
  // Error handling
  error: string | null;
  
  // Configuration
  useMemory: boolean;
  threadId: string | null;
}

/**
 * Centralized state manager for discussion feature
 * Handles all state transitions and side effects
 */
class DiscussionStateManager {
  private state = writable<DiscussionState>({
    activeDiscussion: null,
    activeAgent: null,
    isLoading: false,
    isStreaming: false,
    isSaving: false,
    messages: [],
    userMessageCount: 0,
    error: null,
    useMemory: false,
    threadId: null,
  });

  // Derived stores for specific state slices
  public readonly discussion$ = derived(this.state, $state => $state.activeDiscussion);
  public readonly agent$ = derived(this.state, $state => $state.activeAgent);
  public readonly messages$ = derived(this.state, $state => $state.messages);
  public readonly isStreaming$ = derived(this.state, $state => $state.isStreaming);
  public readonly userMessageCount$ = derived(this.state, $state => $state.userMessageCount);

  constructor() {
    // Subscribe to state changes for debugging in development
    // Uncomment for debugging:
    // if (import.meta.env.DEV) {
    //   this.state.subscribe(state => {
    //     console.log('[DiscussionStateManager] State updated:', state);
    //   });
    // }
  }

  /**
   * Initialize a new discussion session
   */
  async initializeDiscussion(discussion: DiscussionWithMessages | null, agent: Agent | null) {
    const threadId = discussion ? `discussion-${discussion.id}` : `new-discussion-${agent?.id || 'temp'}`;
    
    // Parse agent configuration
    let useMemory = false;
    if (agent) {
      try {
        const config = JSON.parse(agent.configuration || '{}');
        useMemory = config.useMemory || false;
      } catch (e) {
        console.error('Failed to parse agent config:', e);
      }
    }

    this.state.update(state => ({
      ...state,
      activeDiscussion: discussion,
      activeAgent: agent || (discussion?.agent as Agent) || null,
      messages: discussion?.messages || [],
      userMessageCount: this.countUserMessages(discussion?.messages || []),
      useMemory,
      threadId,
      error: null,
    }));

    // Sync with chatbot store for UI
    this.syncChatbotStore(threadId, discussion?.messages || []);
  }

  /**
   * Create a new discussion on first message
   */
  async createDiscussion(agentId: number, firstMessage: string): Promise<DiscussionWithMessages | null> {
    this.state.update(state => ({ ...state, isSaving: true, error: null }));

    try {
      const title = firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '');
      const discussion = await discussionService.createNewDiscussionWithAgent(agentId, title);
      
      // Update state with new discussion
      this.state.update(state => ({
        ...state,
        activeDiscussion: discussion,
        threadId: `discussion-${discussion.id}`,
        isSaving: false,
      }));

      return discussion;
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  /**
   * Add a message to the current discussion
   */
  async addMessage(message: Message) {
    this.state.update(state => ({
      ...state,
      messages: [...state.messages, message],
      userMessageCount: message.who === 'user' 
        ? state.userMessageCount + 1 
        : state.userMessageCount,
    }));

    // Update chatbot store with the same message ID (skip system messages)
    const threadId = get(this.state).threadId;
    if (threadId && message.who !== 'system') {
      const chatMessage: ChatMessage = {
        id: `msg-${message.id}`,
        role: message.who === 'user' ? 'user' : 'assistant',
        content: message.content,
        createdAtIso: new Date(message.createdAt).toISOString()
      };
      chatbotStore.addMessageDirectly(threadId, chatMessage);
    }
  }

  /**
   * Update a message (for streaming)
   */
  updateMessage(messageId: number, content: string) {
    this.state.update(state => ({
      ...state,
      messages: state.messages.map(msg =>
        msg.id === messageId ? { ...msg, content } : msg
      ),
    }));

    // Update in chatbot store as well
    const threadId = get(this.state).threadId;
    if (threadId) {
      chatbotStore.updateMessage(threadId, `msg-${messageId}`, content);
    }
  }

  /**
   * Set streaming state
   */
  setStreaming(isStreaming: boolean) {
    this.state.update(state => ({ ...state, isStreaming }));
  }

  /**
   * Set loading state
   */
  setLoading(isLoading: boolean) {
    this.state.update(state => ({ ...state, isLoading }));
  }

  /**
   * Clear current discussion
   */
  clearDiscussion() {
    const threadId = get(this.state).threadId;
    if (threadId) {
      chatbotStore.replaceThreadMessages(threadId, []);
    }

    this.state.set({
      activeDiscussion: null,
      activeAgent: null,
      isLoading: false,
      isStreaming: false,
      isSaving: false,
      messages: [],
      userMessageCount: 0,
      error: null,
      useMemory: false,
      threadId: null,
    });
  }

  /**
   * Handle errors
   */
  private handleError(error: any) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    console.error('[DiscussionStateManager] Error:', error);
    
    this.state.update(state => ({
      ...state,
      error: errorMessage,
      isLoading: false,
      isStreaming: false,
      isSaving: false,
    }));
  }

  /**
   * Count only user messages (not system or agent messages)
   */
  private countUserMessages(messages: Message[]): number {
    return messages.filter(msg => msg.who === 'user').length;
  }

  /**
   * Sync messages with chatbot store for UI display
   */
  private syncChatbotStore(threadId: string, messages: Message[]) {
    // Ensure the thread exists first
    chatbotStore.setActiveThread(threadId);
    
    // Filter out system messages and convert to chat messages
    const chatMessages = messages
      .filter(msg => msg.who !== 'system') // Only show user and agent messages
      .map(msg => ({
        id: `msg-${msg.id}`,
        role: msg.who === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
        createdAtIso: new Date(msg.createdAt).toISOString(),
      }));
    
    chatbotStore.replaceThreadMessages(threadId, chatMessages);
  }

  /**
   * Get current state snapshot
   */
  getState(): DiscussionState {
    return get(this.state);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: (state: DiscussionState) => void) {
    return this.state.subscribe(callback);
  }
}

// Export singleton instance
export const discussionStateManager = new DiscussionStateManager();