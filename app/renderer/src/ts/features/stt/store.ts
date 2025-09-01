// Speech-to-Text store

import { writable, derived } from 'svelte/store';
import type { STTState, STTRequest, STTResponse } from './types';
import { STTService } from './service';

function createSTTStore() {
  const service = STTService.getInstance();
  
  const { subscribe, set, update } = writable<STTState>({
    isTranscribing: false,
    isRecording: false,
    history: [],
  });

  return {
    subscribe,
    
    async transcribe(request: STTRequest) {
      update(state => ({
        ...state,
        isTranscribing: true,
        currentRequest: request,
        error: undefined,
      }));

      try {
        const response = await service.transcribe(request);
        
        if (response.error) {
          update(state => ({
            ...state,
            isTranscribing: false,
            error: response.error,
          }));
        } else {
          update(state => ({
            ...state,
            isTranscribing: false,
            lastTranscription: response,
            history: service.getHistory(),
            error: undefined,
          }));
        }
        
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          isTranscribing: false,
          error: errorMessage,
        }));
        throw error;
      }
    },

    async transcribeFromRecording(audioBlob: Blob, options?: STTRequest['options']) {
      return this.transcribe({ audio: audioBlob, options });
    },

    async transcribeFromFile(file: File, options?: STTRequest['options']) {
      return this.transcribe({ audio: file, options });
    },

    setRecording(isRecording: boolean) {
      update(state => ({
        ...state,
        isRecording,
      }));
    },

    loadHistory() {
      const history = service.getHistory();
      update(state => ({
        ...state,
        history,
      }));
    },

    deleteHistoryItem(id: string) {
      service.deleteHistoryItem(id);
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

    clearLastTranscription() {
      update(state => ({
        ...state,
        lastTranscription: undefined,
      }));
    },
  };
}

export const sttStore = createSTTStore();

// Derived stores for specific state slices
export const isTranscribing = derived(sttStore, $store => $store.isTranscribing);
export const isRecording = derived(sttStore, $store => $store.isRecording);
export const lastTranscription = derived(sttStore, $store => $store.lastTranscription);
export const sttHistory = derived(sttStore, $store => $store.history);
export const sttError = derived(sttStore, $store => $store.error);