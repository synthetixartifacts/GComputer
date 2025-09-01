// OpenAI Vision adapter

import type { VisionProvider, VisionRequest, VisionResponse, VisionModel, VisionAnalysis } from '../types';
import { adminService } from '@features/admin/service';

export class OpenAIVisionAdapter implements VisionProvider {
  private apiKey: string = '';
  private baseUrl: string = 'https://api.openai.com/v1';

  async initialize(): Promise<void> {
    // Get OpenAI provider configuration
    const providers = await adminService.getProviders({ code: 'openai' });
    if (providers.length > 0) {
      const provider = providers[0];
      this.apiKey = provider.secretKey || '';
      this.baseUrl = provider.url || this.baseUrl;
    }
  }

  async analyze(request: VisionRequest): Promise<VisionResponse> {
    try {
      await this.initialize();

      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const model = request.options?.model || 'gpt-4o';
      const maxTokens = request.options?.maxTokens || 500;
      const temperature = request.options?.temperature || 0.7;

      // Build content array with images and text
      const content: Array<{ type: string; text?: string; image_url?: { url: string; detail?: string } }> = [
        {
          type: 'text',
          text: request.prompt,
        },
      ];

      // Add images to content
      for (const image of request.images) {
        let imageUrl: string;
        if (image.url) {
          imageUrl = image.url;
        } else if (image.base64) {
          // OpenAI expects base64 images to have data URL prefix
          imageUrl = `data:image/jpeg;base64,${image.base64}`;
        } else {
          continue; // Skip invalid images
        }

        content.push({
          type: 'image_url',
          image_url: {
            url: imageUrl,
            detail: image.detail || request.options?.detail || 'auto',
          },
        });
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.mapModel(model),
          messages: [
            {
              role: 'user',
              content,
            },
          ],
          max_tokens: maxTokens,
          temperature,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI Vision error: ${error}`);
      }

      const data = await response.json();
      const responseText = data.choices[0]?.message?.content || '';
      const tokensUsed = data.usage?.total_tokens;

      // Parse the response to extract structured analysis
      const analysis = this.parseAnalysis(responseText);

      return {
        analysis,
        model,
        prompt: request.prompt,
        tokensUsed,
      };
    } catch (error) {
      console.error('OpenAI Vision error:', error);
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

  getSupportedModels(): VisionModel[] {
    return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-vision-preview'];
  }

  getMaxImageSize(): number {
    // OpenAI supports up to 20MB per image
    return 20 * 1024 * 1024;
  }

  getMaxImagesPerRequest(): number {
    // OpenAI supports multiple images in a single request
    return 10;
  }

  private mapModel(model: VisionModel): string {
    // Map our model names to OpenAI's API model names
    const modelMap: Record<VisionModel, string> = {
      'gpt-4o': 'gpt-4o',
      'gpt-4o-mini': 'gpt-4o-mini',
      'gpt-4-vision-preview': 'gpt-4-vision-preview',
    };
    return modelMap[model] || 'gpt-4o';
  }

  private parseAnalysis(responseText: string): VisionAnalysis {
    // Try to extract structured information from the response
    const analysis: VisionAnalysis = {
      description: responseText,
      objects: [],
      text: [],
      colors: [],
    };

    // Extract objects (looking for patterns like "objects: ..." or bullet points)
    const objectMatch = responseText.match(/objects?:?\s*([^\n]+)/i);
    if (objectMatch) {
      analysis.objects = objectMatch[1].split(/[,;]/).map(s => s.trim()).filter(s => s);
    }

    // Extract text found in image
    const textMatch = responseText.match(/text:?\s*([^\n]+)/i);
    if (textMatch) {
      analysis.text = textMatch[1].split(/[,;]/).map(s => s.trim()).filter(s => s);
    }

    // Extract colors
    const colorMatch = responseText.match(/colors?:?\s*([^\n]+)/i);
    if (colorMatch) {
      analysis.colors = colorMatch[1].split(/[,;]/).map(s => s.trim()).filter(s => s);
    }

    return analysis;
  }
}