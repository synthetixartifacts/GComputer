// Vision/Image Analysis service

import type { VisionRequest, VisionResponse, VisionProvider, VisionModel, VisionHistoryItem, VisionImage } from './types';
import { OpenAIVisionAdapter } from './adapters/openai-vision-adapter';
import { imageToBase64 } from './types';

export class VisionService {
  private static instance: VisionService;
  private provider: VisionProvider;
  private history: VisionHistoryItem[] = [];

  private constructor() {
    // Default to OpenAI provider
    this.provider = new OpenAIVisionAdapter();
  }

  static getInstance(): VisionService {
    if (!VisionService.instance) {
      VisionService.instance = new VisionService();
    }
    return VisionService.instance;
  }

  async analyze(request: VisionRequest): Promise<VisionResponse> {
    try {
      // Use window.gc.vision if available (Electron path)
      if (window.gc?.vision?.analyze) {
        return await window.gc.vision.analyze(request);
      }

      // Fallback to direct provider call (browser path)
      const response = await this.provider.analyze(request);
      
      if (response.analysis && !response.error) {
        // Add to history
        const historyItem: VisionHistoryItem = {
          id: crypto.randomUUID(),
          images: request.images,
          prompt: request.prompt,
          analysis: response.analysis,
          model: response.model,
          createdAt: new Date(),
        };
        this.history.push(historyItem);
      }

      return response;
    } catch (error) {
      console.error('Vision analysis error:', error);
      return {
        analysis: {
          description: '',
        },
        model: request.options?.model || 'gpt-4o',
        prompt: request.prompt,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async analyzeImage(image: File | Blob | string, prompt: string, options?: VisionRequest['options']): Promise<VisionResponse> {
    let visionImage: VisionImage;
    
    if (typeof image === 'string') {
      // URL or base64
      if (image.startsWith('data:') || image.startsWith('http')) {
        visionImage = {
          url: image,
          format: 'url',
          detail: options?.detail,
        };
      } else {
        visionImage = {
          base64: image,
          format: 'base64',
          detail: options?.detail,
        };
      }
    } else {
      // File or Blob - convert to base64
      const base64 = await imageToBase64(image);
      visionImage = {
        base64,
        format: 'base64',
        detail: options?.detail,
      };
    }

    const request: VisionRequest = {
      images: [visionImage],
      prompt,
      options,
    };

    return this.analyze(request);
  }

  async analyzeScreenshot(base64: string, prompt: string, options?: VisionRequest['options']): Promise<VisionResponse> {
    const request: VisionRequest = {
      images: [{
        base64,
        format: 'base64',
        detail: options?.detail || 'high',
      }],
      prompt,
      options,
    };

    return this.analyze(request);
  }

  async analyzeMultipleImages(images: Array<File | Blob | string>, prompt: string, options?: VisionRequest['options']): Promise<VisionResponse> {
    const visionImages: VisionImage[] = await Promise.all(
      images.map(async (image) => {
        if (typeof image === 'string') {
          if (image.startsWith('data:') || image.startsWith('http')) {
            return {
              url: image,
              format: 'url' as const,
              detail: options?.detail,
            };
          } else {
            return {
              base64: image,
              format: 'base64' as const,
              detail: options?.detail,
            };
          }
        } else {
          const base64 = await imageToBase64(image);
          return {
            base64,
            format: 'base64' as const,
            detail: options?.detail,
          };
        }
      })
    );

    const request: VisionRequest = {
      images: visionImages,
      prompt,
      options,
    };

    return this.analyze(request);
  }

  getSupportedModels(): VisionModel[] {
    return this.provider.getSupportedModels();
  }

  getMaxImageSize(): number {
    return this.provider.getMaxImageSize();
  }

  getMaxImagesPerRequest(): number {
    return this.provider.getMaxImagesPerRequest();
  }

  getHistory(): VisionHistoryItem[] {
    return this.history;
  }

  clearHistory(): void {
    this.history = [];
  }

  deleteHistoryItem(id: string): void {
    const index = this.history.findIndex(item => item.id === id);
    if (index !== -1) {
      this.history.splice(index, 1);
    }
  }

  setProvider(provider: VisionProvider): void {
    this.provider = provider;
  }
}