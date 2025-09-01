// Vision/Image Analysis types

export type VisionModel = 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-vision-preview';
export type ImageDetail = 'auto' | 'low' | 'high';
export type ImageFormat = 'url' | 'base64';

export interface VisionImage {
  url?: string;
  base64?: string;
  format: ImageFormat;
  detail?: ImageDetail;
}

export interface VisionOptions {
  model?: VisionModel;
  maxTokens?: number;
  temperature?: number;
  detail?: ImageDetail;
}

export interface VisionRequest {
  images: VisionImage[];
  prompt: string;
  options?: VisionOptions;
  agentId?: number;
}

export interface VisionAnalysis {
  description: string;
  objects?: string[];
  text?: string[];
  colors?: string[];
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface VisionResponse {
  analysis: VisionAnalysis;
  model: VisionModel;
  prompt: string;
  tokensUsed?: number;
  error?: string;
}

export interface VisionHistoryItem {
  id: string;
  images: VisionImage[];
  prompt: string;
  analysis: VisionAnalysis;
  model: VisionModel;
  createdAt: Date;
}

export interface VisionState {
  isAnalyzing: boolean;
  currentRequest?: VisionRequest;
  lastAnalysis?: VisionResponse;
  history: VisionHistoryItem[];
  error?: string;
}

export interface VisionProvider {
  analyze(request: VisionRequest): Promise<VisionResponse>;
  getSupportedModels(): VisionModel[];
  getMaxImageSize(): number;
  getMaxImagesPerRequest(): number;
}

export const VISION_MODELS: Record<VisionModel, string> = {
  'gpt-4o': 'GPT-4o (Latest)',
  'gpt-4o-mini': 'GPT-4o Mini',
  'gpt-4-vision-preview': 'GPT-4 Vision Preview',
};

export const IMAGE_DETAILS: Record<ImageDetail, string> = {
  auto: 'Auto',
  low: 'Low (Fast)',
  high: 'High (Detailed)',
};

// Helper function to convert image to base64
export async function imageToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get pure base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper function to check if URL is valid
export function isValidImageUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}