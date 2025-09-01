import { ipcMain } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';

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

async function getOpenAIConfig() {
  const { db } = await import('../db/index.js');
  const providers = await db.query.aiProviders.findMany({
    where: (providers, { eq }) => eq(providers.code, 'openai')
  });
  
  if (providers.length === 0) {
    throw new Error('OpenAI provider not configured');
  }
  
  return {
    apiKey: providers[0].secretKey || '',
    baseUrl: providers[0].url || 'https://api.openai.com/v1'
  };
}

async function analyze(request: VisionRequest): Promise<VisionResponse> {
  try {
    const config = await getOpenAIConfig();
    
    if (!config.apiKey) {
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
        continue;
      }

      content.push({
        type: 'image_url',
        image_url: {
          url: imageUrl,
          detail: image.detail || request.options?.detail || 'auto',
        },
      });
    }

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: mapModel(model),
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
    const analysis = parseAnalysis(responseText);

    return {
      analysis,
      model,
      prompt: request.prompt,
      tokensUsed,
    };
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

function mapModel(model: string): string {
  const modelMap: Record<string, string> = {
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    'gpt-4-vision-preview': 'gpt-4-vision-preview',
  };
  return modelMap[model] || 'gpt-4o';
}

function parseAnalysis(responseText: string): VisionAnalysis {
  const analysis: VisionAnalysis = {
    description: responseText,
    objects: [],
    text: [],
    colors: [],
  };

  // Extract objects
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

export function registerVisionHandlers(): void {
  ipcMain.handle('vision:analyze', async (_event: IpcMainInvokeEvent, request: VisionRequest): Promise<VisionResponse> => {
    return analyze(request);
  });
}