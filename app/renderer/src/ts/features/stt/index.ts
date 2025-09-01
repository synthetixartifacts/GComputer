// Speech-to-Text feature exports

export * from './types';
export { STTService } from './service';
export { sttStore, isTranscribing, isRecording, lastTranscription, sttHistory, sttError } from './store';
export { OpenAISTTAdapter } from './adapters/openai-stt-adapter';