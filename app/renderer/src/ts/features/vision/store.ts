// Vision/Image Analysis store

import { writable, derived } from 'svelte/store';
import type { VisionState, VisionRequest, VisionImage } from './types';
import { VisionService } from './service';

function createVisionStore() {
  const service = VisionService.getInstance();
  
  const { subscribe, set, update } = writable<VisionState>({
    isAnalyzing: false,
    history: [],
  });

  return {
    subscribe,
    
    async analyze(request: VisionRequest) {
      update(state => ({
        ...state,
        isAnalyzing: true,
        currentRequest: request,
        error: undefined,
      }));

      try {
        const response = await service.analyze(request);
        
        if (response.error) {
          update(state => ({
            ...state,
            isAnalyzing: false,
            error: response.error,
          }));
        } else {
          update(state => ({
            ...state,
            isAnalyzing: false,
            lastAnalysis: response,
            history: service.getHistory(),
            error: undefined,
          }));
        }
        
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          isAnalyzing: false,
          error: errorMessage,
        }));
        throw error;
      }
    },

    async analyzeImage(image: File | Blob | string, prompt: string, options?: VisionRequest['options']) {
      return service.analyzeImage(image, prompt, options);
    },

    async analyzeScreenshot(base64: string, prompt: string, options?: VisionRequest['options']) {
      return service.analyzeScreenshot(base64, prompt, options);
    },

    async analyzeMultipleImages(images: Array<File | Blob | string>, prompt: string, options?: VisionRequest['options']) {
      return service.analyzeMultipleImages(images, prompt, options);
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

    clearLastAnalysis() {
      update(state => ({
        ...state,
        lastAnalysis: undefined,
      }));
    },
  };
}

export const visionStore = createVisionStore();

// Derived stores for specific state slices
export const isAnalyzing = derived(visionStore, $store => $store.isAnalyzing);
export const lastAnalysis = derived(visionStore, $store => $store.lastAnalysis);
export const visionHistory = derived(visionStore, $store => $store.history);
export const visionError = derived(visionStore, $store => $store.error);