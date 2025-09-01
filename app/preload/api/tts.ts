import { ipcRenderer } from 'electron';

interface TTSRequest {
  text: string;
  options?: {
    model?: string;
    voice?: string;
    speed?: number;
    format?: string;
  };
}

interface TTSResponse {
  audioUrl?: string;
  audioData?: ArrayBuffer;
  duration?: number;
  format: string;
  model: string;
  voice: string;
  error?: string;
}

export const ttsApi = {
  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    return ipcRenderer.invoke('tts:generateSpeech', request);
  },
};