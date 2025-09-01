// OpenAI Text-to-Speech adapter

import type { TTSProvider, TTSRequest, TTSResponse, TTSVoice, TTSFormat } from '../types';
import { adminService } from '@features/admin/service';

export class OpenAITTSAdapter implements TTSProvider {
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

  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      await this.initialize();

      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const model = request.options?.model || 'tts-1';
      const voice = request.options?.voice || 'alloy';
      const format = request.options?.format || 'mp3';
      const speed = request.options?.speed || 1.0;

      const response = await fetch(`${this.baseUrl}/audio/speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: request.text,
          voice,
          response_format: format,
          speed,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI TTS error: ${error}`);
      }

      const audioData = await response.arrayBuffer();
      const blob = new Blob([audioData], { type: this.getMimeType(format) });
      const audioUrl = URL.createObjectURL(blob);

      // Calculate approximate duration (this is an estimate)
      const duration = this.estimateDuration(request.text, speed);

      return {
        audioUrl,
        audioData,
        duration,
        format,
        model,
        voice,
      };
    } catch (error) {
      console.error('OpenAI TTS error:', error);
      return {
        format: request.options?.format || 'mp3',
        model: request.options?.model || 'tts-1',
        voice: request.options?.voice || 'alloy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async* streamSpeech(request: TTSRequest): AsyncGenerator<Uint8Array> {
    await this.initialize();

    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const model = request.options?.model || 'tts-1';
    const voice = request.options?.voice || 'alloy';
    const format = request.options?.format || 'mp3';
    const speed = request.options?.speed || 1.0;

    const response = await fetch(`${this.baseUrl}/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: request.text,
        voice,
        response_format: format,
        speed,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI TTS streaming error: ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Unable to read stream');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  }

  getSupportedVoices(): TTSVoice[] {
    return ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  }

  getSupportedFormats(): TTSFormat[] {
    return ['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm'];
  }

  private getMimeType(format: TTSFormat): string {
    const mimeTypes: Record<TTSFormat, string> = {
      mp3: 'audio/mpeg',
      opus: 'audio/opus',
      aac: 'audio/aac',
      flac: 'audio/flac',
      wav: 'audio/wav',
      pcm: 'audio/pcm',
    };
    return mimeTypes[format] || 'audio/mpeg';
  }

  private estimateDuration(text: string, speed: number): number {
    // Rough estimate: ~150 words per minute at normal speed
    const words = text.split(/\s+/).length;
    const wordsPerMinute = 150 * speed;
    return (words / wordsPerMinute) * 60; // Duration in seconds
  }
}