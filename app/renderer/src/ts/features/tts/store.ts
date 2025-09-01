// Text-to-Speech store

import { writable, derived } from 'svelte/store';
import type { TTSState, TTSRequest, TTSHistoryItem } from './types';
import { TTSService } from './service';

function createTTSStore() {
  const service = TTSService.getInstance();
  
  const { subscribe, set, update } = writable<TTSState>({
    isGenerating: false,
    history: [],
  });

  return {
    subscribe,
    
    async generate(request: TTSRequest) {
      update(state => ({
        ...state,
        isGenerating: true,
        currentRequest: request,
        error: undefined,
      }));

      try {
        const response = await service.generateSpeech(request);
        
        if (response.error) {
          update(state => ({
            ...state,
            isGenerating: false,
            error: response.error,
          }));
        } else {
          update(state => ({
            ...state,
            isGenerating: false,
            history: service.getHistory(),
            error: undefined,
          }));
        }
        
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          isGenerating: false,
          error: errorMessage,
        }));
        throw error;
      }
    },

    async streamGenerate(request: TTSRequest) {
      update(state => ({
        ...state,
        isGenerating: true,
        currentRequest: request,
        error: undefined,
      }));

      try {
        const stream = service.streamSpeech(request);
        return stream;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          isGenerating: false,
          error: errorMessage,
        }));
        throw error;
      } finally {
        update(state => ({
          ...state,
          isGenerating: false,
        }));
      }
    },

    loadHistory() {
      const history = service.getHistory();
      update(state => ({
        ...state,
        history,
      }));
    },

    async deleteHistoryItem(id: string) {
      await service.deleteHistoryItem(id);
      update(state => ({
        ...state,
        history: service.getHistory(),
      }));
    },

    clearHistory() {
      service.clearHistory();
      update(state => ({
        ...state,
        history: [],
      }));
    },

    clearError() {
      update(state => ({
        ...state,
        error: undefined,
      }));
    },
  };
}

export const ttsStore = createTTSStore();

// Derived stores for specific state slices
export const isGenerating = derived(ttsStore, $store => $store.isGenerating);
export const ttsHistory = derived(ttsStore, $store => $store.history);
export const ttsError = derived(ttsStore, $store => $store.error);