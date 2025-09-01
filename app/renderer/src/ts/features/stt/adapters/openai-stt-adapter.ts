// OpenAI Speech-to-Text adapter

import type { STTProvider, STTRequest, STTResponse, STTModel, STTLanguage, STTFormat } from '../types';
import { adminService } from '@features/admin/service';

export class OpenAISTTAdapter implements STTProvider {
  private apiKey: string = '';
  private baseUrl: string = 'https://api.openai.com/v1';

  async initialize(): Promise<void> {
    // Get OpenAI provider configuration
    const providers = await adminService.getProviders({ code: 'openai' });
    if (providers.length > 0) {
      const provider = providers[0];
      this.apiKey = provider.secretKey || '';
      this.baseUrl = provider.url || this.baseUrl;
    }
  }

  async transcribe(request: STTRequest): Promise<STTResponse> {
    try {
      await this.initialize();

      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const model = request.options?.model || 'whisper-1';
      const language = request.options?.language && request.options.language !== 'auto' 
        ? request.options.language 
        : undefined;
      const format = request.options?.format || 'json';
      const temperature = request.options?.temperature || 0;

      // Convert audio to File if needed
      let audioFile: File;
      if (request.audio instanceof File) {
        audioFile = request.audio;
      } else if (request.audio instanceof Blob) {
        audioFile = new File([request.audio], 'audio.webm', { type: 'audio/webm' });
      } else if (request.audio instanceof ArrayBuffer) {
        const blob = new Blob([request.audio], { type: 'audio/webm' });
        audioFile = new File([blob], 'audio.webm', { type: 'audio/webm' });
      } else {
        throw new Error('Invalid audio input type');
      }

      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', this.mapModel(model));
      if (language) {
        formData.append('language', language);
      }
      if (request.options?.prompt) {
        formData.append('prompt', request.options.prompt);
      }
      formData.append('temperature', temperature.toString());
      formData.append('response_format', format);

      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI STT error: ${error}`);
      }

      const data = await response.json();

      // Calculate duration from audio
      const duration = await this.getAudioDuration(audioFile);

      if (format === 'verbose_json') {
        return {
          text: data.text,
          language: data.language,
          duration,
          segments: data.segments,
          model,
        };
      } else if (format === 'text') {
        return {
          text: data,
          duration,
          model,
        };
      } else {
        return {
          text: data.text,
          language: data.language,
          duration,
          model,
        };
      }
    } catch (error) {
      console.error('OpenAI STT error:', error);
      return {
        text: '',
        model: request.options?.model || 'whisper-1',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  getSupportedModels(): STTModel[] {
    return ['whisper-1', 'gpt-4o-transcribe', 'gpt-4o-mini-transcribe'];
  }

  getSupportedLanguages(): STTLanguage[] {
    return ['auto', 'en', 'fr', 'es', 'de', 'it', 'pt', 'ja', 'ko', 'zh'];
  }

  getSupportedFormats(): STTFormat[] {
    return ['json', 'text', 'srt', 'verbose_json', 'vtt'];
  }

  private mapModel(model: STTModel): string {
    // Map our model names to OpenAI's API model names
    const modelMap: Record<STTModel, string> = {
      'whisper-1': 'whisper-1',
      'gpt-4o-transcribe': 'gpt-4o-audio-preview', // Placeholder - update when available
      'gpt-4o-mini-transcribe': 'gpt-4o-mini-audio-preview', // Placeholder - update when available
    };
    return modelMap[model] || 'whisper-1';
  }

  private async getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
      });
      audio.addEventListener('error', () => {
        resolve(0); // Return 0 if we can't determine duration
      });
      audio.src = URL.createObjectURL(file);
    });
  }
}