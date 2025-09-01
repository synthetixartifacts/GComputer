import { ipcRenderer } from 'electron';

interface VisionImage {
  url?: string;
  base64?: string;
  format: 'url' | 'base64';
  detail?: 'auto' | 'low' | 'high';
}

interface VisionRequest {
  images: VisionImage[];
  prompt: string;
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    detail?: 'auto' | 'low' | 'high';
  };
}

interface VisionAnalysis {
  description: string;
  objects?: string[];
  text?: string[];
  colors?: string[];
  confidence?: number;
  metadata?: Record<string, unknown>;
}

interface VisionResponse {
  analysis: VisionAnalysis;
  model: string;
  prompt: string;
  tokensUsed?: number;
  error?: string;
}

export const visionApi = {
  async analyze(request: VisionRequest): Promise<VisionResponse> {
    return ipcRenderer.invoke('vision:analyze', request);
  },
};