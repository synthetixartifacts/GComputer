import { writable } from 'svelte/store';
import type { ChatMessage, ChatThread } from './types';
import { generateId, nowIso } from './service';

export interface ChatbotState {
  threads: Record<string, ChatThread>;
  activeThreadId: string | null;
}

const initialThreadId = 'styleguide-demo';

const initialState: ChatbotState = {
  threads: {
    [initialThreadId]: {
      id: initialThreadId,
      messages: [
        { id: generateId('msg'), role: 'assistant', content: 'Welcome to the Chatbot demo. Ask me anything!', createdAtIso: nowIso() },
      ],
    },
  },
  activeThreadId: initialThreadId,
};

function createStore() {
  const { subscribe, update } = writable<ChatbotState>(initialState);

  function ensureThread(threadId: string): void {
    update((state) => {
      if (!state.threads[threadId]) {
        state.threads[threadId] = { id: threadId, messages: [] };
      }
      return state;
    });
  }

  function addUserMessage(threadId: string, content: string): void {
    const message: ChatMessage = {
      id: generateId('user'),
      role: 'user',
      content,
      createdAtIso: nowIso(),
    };
    update((state) => {
      ensureThread(threadId);
      state.threads[threadId].messages.push(message);
      return state;
    });
  }

  function addAssistantMessage(threadId: string, content: string): void {
    const message: ChatMessage = {
      id: generateId('assistant'),
      role: 'assistant',
      content,
      createdAtIso: nowIso(),
    };
    update((state) => {
      ensureThread(threadId);
      state.threads[threadId].messages.push(message);
      return state;
    });
  }

  function setActiveThread(threadId: string): void {
    update((state) => {
      ensureThread(threadId);
      state.activeThreadId = threadId;
      return state;
    });
  }

  function replaceThreadMessages(threadId: string, messages: ChatMessage[]): void {
    update((state) => {
      ensureThread(threadId);
      state.threads[threadId].messages = [...messages];
      return state;
    });
  }

  function addMessageDirectly(threadId: string, message: ChatMessage): void {
    update((state) => {
      ensureThread(threadId);
      state.threads[threadId].messages.push(message);
      return state;
    });
  }

  function updateMessage(threadId: string, messageId: string, newContent: string): void {
    update((state) => {
      ensureThread(threadId);
      const thread = state.threads[threadId];
      const messageIndex = thread.messages.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        thread.messages[messageIndex].content = newContent;
      }
      return state;
    });
  }

  function removeMessage(threadId: string, messageId: string): void {
    update((state) => {
      ensureThread(threadId);
      const thread = state.threads[threadId];
      thread.messages = thread.messages.filter(msg => msg.id !== messageId);
      return state;
    });
  }

  return {
    subscribe,
    addUserMessage,
    addAssistantMessage,
    setActiveThread,
    replaceThreadMessages,
    addMessageDirectly,
    updateMessage,
    removeMessage,
  };
}

export const chatbotStore = createStore();


