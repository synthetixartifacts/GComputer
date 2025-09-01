// Speech-to-Text service

import type { STTRequest, STTResponse, STTProvider, STTModel, STTLanguage, STTFormat, STTHistoryItem } from './types';
import { OpenAISTTAdapter } from './adapters/openai-stt-adapter';

export class STTService {
  private static instance: STTService;
  private provider: STTProvider;
  private history: STTHistoryItem[] = [];

  private constructor() {
    // Default to OpenAI provider
    this.provider = new OpenAISTTAdapter();
  }

  static getInstance(): STTService {
    if (!STTService.instance) {
      STTService.instance = new STTService();
    }
    return STTService.instance;
  }

  async transcribe(request: STTRequest): Promise<STTResponse> {
    try {
      // Use window.gc.stt if available (Electron path)
      if (window.gc?.stt?.transcribe) {
        return await window.gc.stt.transcribe(request);
      }

      // Fallback to direct provider call (browser path)
      const response = await this.provider.transcribe(request);
      
      if (response.text && !response.error) {
        // Calculate audio size
        let audioSize = 0;
        if (request.audio instanceof File) {
          audioSize = request.audio.size;
        } else if (request.audio instanceof Blob) {
          audioSize = request.audio.size;
        } else if (request.audio instanceof ArrayBuffer) {
          audioSize = request.audio.byteLength;
        }

        // Add to history
        const historyItem: STTHistoryItem = {
          id: crypto.randomUUID(),
          text: response.text,
          language: response.language || 'unknown',
          duration: response.duration || 0,
          model: response.model,
          audioSize,
          createdAt: new Date(),
        };
        this.history.push(historyItem);
      }

      return response;
    } catch (error) {
      console.error('STT transcription error:', error);
      return {
        text: '',
        model: request.options?.model || 'whisper-1',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async transcribeFromRecording(audioBlob: Blob, options?: STTRequest['options']): Promise<STTResponse> {
    const request: STTRequest = {
      audio: audioBlob,
      options,
    };
    return this.transcribe(request);
  }

  async transcribeFromFile(file: File, options?: STTRequest['options']): Promise<STTResponse> {
    const request: STTRequest = {
      audio: file,
      options,
    };
    return this.transcribe(request);
  }

  getSupportedModels(): STTModel[] {
    return this.provider.getSupportedModels();
  }

  getSupportedLanguages(): STTLanguage[] {
    return this.provider.getSupportedLanguages();
  }

  getSupportedFormats(): STTFormat[] {
    return this.provider.getSupportedFormats();
  }

  getHistory(): STTHistoryItem[] {
    return this.history;
  }

  clearHistory(): void {
    this.history = [];
  }

  deleteHistoryItem(id: string): void {
    const index = this.history.findIndex(item => item.id === id);
    if (index !== -1) {
      this.history.splice(index, 1);
    }
  }

  setProvider(provider: STTProvider): void {
    this.provider = provider;
  }
}