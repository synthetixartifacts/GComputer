import { ipcMain } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';

interface TTSRequest {
  text: string;
  options?: {
    model?: string;
    voice?: string;
    speed?: number;
    format?: string;
  };
}

interface TTSResponse {
  audioUrl?: string;
  audioData?: ArrayBuffer;
  duration?: number;
  format: string;
  model: string;
  voice: string;
  error?: string;
}

async function getOpenAIConfig() {
  // Get config from database
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

async function generateSpeech(request: TTSRequest): Promise<TTSResponse> {
  try {
    const config = await getOpenAIConfig();
    
    if (!config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const model = request.options?.model || 'tts-1';
    const voice = request.options?.voice || 'alloy';
    const format = request.options?.format || 'mp3';
    const speed = request.options?.speed || 1.0;

    const response = await fetch(`${config.baseUrl}/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: request.text,
        voice,
        response_format: format,
        speed,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI TTS error: ${error}`);
    }

    const audioData = await response.arrayBuffer();
    
    // Convert to base64 for transfer to renderer
    const base64 = Buffer.from(audioData).toString('base64');
    const dataUrl = `data:audio/${format};base64,${base64}`;

    return {
      audioUrl: dataUrl,
      audioData,
      duration: estimateDuration(request.text, speed),
      format,
      model,
      voice,
    };
  } catch (error) {
    console.error('TTS generation error:', error);
    return {
      format: request.options?.format || 'mp3',
      model: request.options?.model || 'tts-1',
      voice: request.options?.voice || 'alloy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function estimateDuration(text: string, speed: number): number {
  // Rough estimate: ~150 words per minute at normal speed
  const words = text.split(/\s+/).length;
  const wordsPerMinute = 150 * speed;
  return (words / wordsPerMinute) * 60; // Duration in seconds
}

export function registerTTSHandlers(): void {
  ipcMain.handle('tts:generateSpeech', async (_event: IpcMainInvokeEvent, request: TTSRequest): Promise<TTSResponse> => {
    return generateSpeech(request);
  });
}