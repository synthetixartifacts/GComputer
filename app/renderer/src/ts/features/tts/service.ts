// Text-to-Speech service

import type { TTSRequest, TTSResponse, TTSProvider, TTSVoice, TTSFormat, TTSHistoryItem } from './types';
import { OpenAITTSAdapter } from './adapters/openai-tts-adapter';

export class TTSService {
  private static instance: TTSService;
  private provider: TTSProvider;
  private history: TTSHistoryItem[] = [];

  private constructor() {
    // Default to OpenAI provider
    this.provider = new OpenAITTSAdapter();
  }

  static getInstance(): TTSService {
    if (!TTSService.instance) {
      TTSService.instance = new TTSService();
    }
    return TTSService.instance;
  }

  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      // Use window.gc.tts if available (Electron path)
      if (window.gc?.tts?.generateSpeech) {
        return await window.gc.tts.generateSpeech(request);
      }

      // Fallback to direct provider call (browser path)
      const response = await this.provider.generateSpeech(request);
      
      if (response.audioUrl && !response.error) {
        // Add to history
        const historyItem: TTSHistoryItem = {
          id: crypto.randomUUID(),
          text: request.text,
          voice: response.voice,
          model: response.model,
          format: response.format,
          audioUrl: response.audioUrl,
          duration: response.duration || 0,
          createdAt: new Date(),
        };
        this.history.push(historyItem);
      }

      return response;
    } catch (error) {
      console.error('TTS generation error:', error);
      return {
        format: request.options?.format || 'mp3',
        model: request.options?.model || 'tts-1',
        voice: request.options?.voice || 'alloy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async* streamSpeech(request: TTSRequest): AsyncGenerator<Uint8Array> {
    if (window.gc?.tts?.streamSpeech) {
      // Electron streaming path
      const stream = window.gc.tts.streamSpeech(request);
      for await (const chunk of stream) {
        yield chunk;
      }
    } else if (this.provider.streamSpeech) {
      // Browser streaming path
      const stream = this.provider.streamSpeech(request);
      for await (const chunk of stream) {
        yield chunk;
      }
    } else {
      throw new Error('Streaming not supported by current provider');
    }
  }

  getSupportedVoices(): TTSVoice[] {
    return this.provider.getSupportedVoices();
  }

  getSupportedFormats(): TTSFormat[] {
    return this.provider.getSupportedFormats();
  }

  getHistory(): TTSHistoryItem[] {
    return this.history;
  }

  clearHistory(): void {
    this.history = [];
  }

  async deleteHistoryItem(id: string): Promise<void> {
    const index = this.history.findIndex(item => item.id === id);
    if (index !== -1) {
      // Clean up audio URL if it's a blob URL
      const item = this.history[index];
      if (item.audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.audioUrl);
      }
      this.history.splice(index, 1);
    }
  }

  setProvider(provider: TTSProvider): void {
    this.provider = provider;
  }
}