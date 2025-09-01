// Speech-to-Text types

export type STTModel = 'whisper-1' | 'gpt-4o-transcribe' | 'gpt-4o-mini-transcribe';
export type STTLanguage = 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh' | 'auto';
export type STTFormat = 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';

export interface STTOptions {
  model?: STTModel;
  language?: STTLanguage;
  prompt?: string;
  temperature?: number; // 0 to 1
  format?: STTFormat;
  timestamps?: boolean;
}

export interface STTRequest {
  audio: File | Blob | ArrayBuffer;
  options?: STTOptions;
  agentId?: number;
}

export interface STTSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

export interface STTResponse {
  text: string;
  language?: string;
  duration?: number;
  segments?: STTSegment[];
  model: STTModel;
  error?: string;
}

export interface STTHistoryItem {
  id: string;
  text: string;
  language: string;
  duration: number;
  model: STTModel;
  audioSize: number;
  createdAt: Date;
}

export interface STTState {
  isTranscribing: boolean;
  isRecording: boolean;
  currentRequest?: STTRequest;
  lastTranscription?: STTResponse;
  history: STTHistoryItem[];
  error?: string;
}

export interface STTProvider {
  transcribe(request: STTRequest): Promise<STTResponse>;
  getSupportedModels(): STTModel[];
  getSupportedLanguages(): STTLanguage[];
  getSupportedFormats(): STTFormat[];
}

export const STT_MODELS: Record<STTModel, string> = {
  'whisper-1': 'Whisper v1',
  'gpt-4o-transcribe': 'GPT-4o Transcribe',
  'gpt-4o-mini-transcribe': 'GPT-4o Mini Transcribe',
};

export const STT_LANGUAGES: Record<STTLanguage, string> = {
  auto: 'Auto-detect',
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
};

export const STT_FORMATS: Record<STTFormat, string> = {
  json: 'JSON',
  text: 'Plain Text',
  srt: 'SRT Subtitles',
  verbose_json: 'Verbose JSON',
  vtt: 'WebVTT',
};