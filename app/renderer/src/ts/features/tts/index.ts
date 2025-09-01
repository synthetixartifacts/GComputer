// Text-to-Speech feature exports

export * from './types';
export { TTSService } from './service';
export { ttsStore, isGenerating, ttsHistory, ttsError } from './store';
export { OpenAITTSAdapter } from './adapters/openai-tts-adapter';