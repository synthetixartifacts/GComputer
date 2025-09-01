// Text-to-Speech types

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
export type TTSModel = 'tts-1' | 'tts-1-hd';
export type TTSFormat = 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';

export interface TTSOptions {
  model?: TTSModel;
  voice?: TTSVoice;
  speed?: number; // 0.25 to 4.0
  format?: TTSFormat;
}

export interface TTSRequest {
  text: string;
  options?: TTSOptions;
  agentId?: number;
}

export interface TTSResponse {
  audioUrl?: string;
  audioData?: ArrayBuffer;
  duration?: number;
  format: TTSFormat;
  model: TTSModel;
  voice: TTSVoice;
  error?: string;
}

export interface TTSHistoryItem {
  id: string;
  text: string;
  voice: TTSVoice;
  model: TTSModel;
  format: TTSFormat;
  audioUrl: string;
  duration: number;
  createdAt: Date;
}

export interface TTSState {
  isGenerating: boolean;
  currentRequest?: TTSRequest;
  history: TTSHistoryItem[];
  error?: string;
}

export interface TTSProvider {
  generateSpeech(request: TTSRequest): Promise<TTSResponse>;
  streamSpeech?(request: TTSRequest): AsyncGenerator<Uint8Array>;
  getSupportedVoices(): TTSVoice[];
  getSupportedFormats(): TTSFormat[];
}

export const TTS_VOICES: Record<TTSVoice, string> = {
  alloy: 'Alloy (Neutral)',
  echo: 'Echo (Male)',
  fable: 'Fable (British)',
  onyx: 'Onyx (Deep Male)',
  nova: 'Nova (Female)',
  shimmer: 'Shimmer (Soft Female)',
};

export const TTS_MODELS: Record<TTSModel, string> = {
  'tts-1': 'Standard (Fast)',
  'tts-1-hd': 'HD (High Quality)',
};

export const TTS_FORMATS: Record<TTSFormat, string> = {
  mp3: 'MP3',
  opus: 'Opus',
  aac: 'AAC',
  flac: 'FLAC',
  wav: 'WAV',
  pcm: 'PCM',
};