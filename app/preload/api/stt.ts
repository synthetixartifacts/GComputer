import { ipcRenderer } from 'electron';

interface STTRequest {
  audio: File | Blob | ArrayBuffer;
  options?: {
    model?: string;
    language?: string;
    prompt?: string;
    temperature?: number;
    format?: string;
  };
}

interface STTResponse {
  text: string;
  language?: string;
  duration?: number;
  segments?: any[];
  model: string;
  error?: string;
}

export const sttApi = {
  async transcribe(request: STTRequest): Promise<STTResponse> {
    // Convert audio to transferable format
    let audioData: { data: string; type: string; name: string };
    
    if (request.audio instanceof File) {
      const buffer = await request.audio.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      audioData = {
        data: base64,
        type: request.audio.type,
        name: request.audio.name,
      };
    } else if (request.audio instanceof Blob) {
      const buffer = await request.audio.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      audioData = {
        data: base64,
        type: request.audio.type,
        name: 'audio.webm',
      };
    } else if (request.audio instanceof ArrayBuffer) {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(request.audio)));
      audioData = {
        data: base64,
        type: 'audio/webm',
        name: 'audio.webm',
      };
    } else {
      throw new Error('Invalid audio input type');
    }

    return ipcRenderer.invoke('stt:transcribe', {
      audio: audioData,
      options: request.options,
    });
  },
};