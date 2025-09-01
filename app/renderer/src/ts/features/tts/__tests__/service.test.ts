import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TTSService } from '../service';
import type { TTSRequest } from '../types';

describe('TTSService', () => {
  let service: TTSService;

  beforeEach(() => {
    // Reset singleton instance
    (TTSService as any).instance = undefined;
    service = TTSService.getInstance();
  });

  it('should be a singleton', () => {
    const service1 = TTSService.getInstance();
    const service2 = TTSService.getInstance();
    expect(service1).toBe(service2);
  });

  it('should generate speech with default options', async () => {
    const request: TTSRequest = {
      text: 'Hello, world!'
    };

    // Mock window.gc
    vi.stubGlobal('window', {
      gc: {
        tts: {
          generateSpeech: vi.fn().mockResolvedValue({
            audioUrl: 'blob:mock-url',
            format: 'mp3',
            model: 'tts-1',
            voice: 'alloy',
            duration: 2.5
          })
        }
      }
    });

    const response = await service.generateSpeech(request);
    
    expect(response.audioUrl).toBe('blob:mock-url');
    expect(response.format).toBe('mp3');
    expect(response.model).toBe('tts-1');
    expect(response.voice).toBe('alloy');
    expect(response.error).toBeUndefined();
  });

  it('should handle errors gracefully', async () => {
    const request: TTSRequest = {
      text: 'Test error'
    };

    vi.stubGlobal('window', {
      gc: {
        tts: {
          generateSpeech: vi.fn().mockRejectedValue(new Error('API error'))
        }
      }
    });

    const response = await service.generateSpeech(request);
    
    expect(response.error).toBe('API error');
    expect(response.audioUrl).toBeUndefined();
  });

  it('should maintain history of successful generations', async () => {
    const request: TTSRequest = {
      text: 'History test'
    };

    vi.stubGlobal('window', {
      gc: {
        tts: {
          generateSpeech: vi.fn().mockResolvedValue({
            audioUrl: 'blob:history-url',
            format: 'mp3',
            model: 'tts-1',
            voice: 'nova',
            duration: 3.0
          })
        }
      }
    });

    await service.generateSpeech(request);
    const history = service.getHistory();
    
    expect(history).toHaveLength(1);
    expect(history[0].text).toBe('History test');
    expect(history[0].audioUrl).toBe('blob:history-url');
    expect(history[0].voice).toBe('nova');
  });

  it('should support all available voices', () => {
    const voices = service.getSupportedVoices();
    expect(voices).toContain('alloy');
    expect(voices).toContain('echo');
    expect(voices).toContain('fable');
    expect(voices).toContain('onyx');
    expect(voices).toContain('nova');
    expect(voices).toContain('shimmer');
  });

  it('should support all available formats', () => {
    const formats = service.getSupportedFormats();
    expect(formats).toContain('mp3');
    expect(formats).toContain('opus');
    expect(formats).toContain('aac');
    expect(formats).toContain('flac');
    expect(formats).toContain('wav');
    expect(formats).toContain('pcm');
  });
});