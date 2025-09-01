import { ipcMain } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import FormData from 'form-data';

interface STTRequest {
  audio: {
    data: string; // base64 encoded audio
    type: string; // mime type
    name: string; // file name
  };
  options?: {
    model?: string;
    language?: string;
    prompt?: string;
    temperature?: number;
    format?: string;
  };
}

interface STTResponse {
  text: string;
  language?: string;
  duration?: number;
  segments?: any[];
  model: string;
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

async function transcribe(request: STTRequest): Promise<STTResponse> {
  try {
    const config = await getOpenAIConfig();
    
    if (!config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const model = request.options?.model || 'whisper-1';
    const language = request.options?.language && request.options.language !== 'auto' 
      ? request.options.language 
      : undefined;
    const format = request.options?.format || 'json';
    const temperature = request.options?.temperature || 0;

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(request.audio.data, 'base64');
    
    // Create form data
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: request.audio.name,
      contentType: request.audio.type,
    });
    formData.append('model', mapModel(model));
    if (language) {
      formData.append('language', language);
    }
    if (request.options?.prompt) {
      formData.append('prompt', request.options.prompt);
    }
    formData.append('temperature', temperature.toString());
    formData.append('response_format', format);

    const response = await fetch(`${config.baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        ...formData.getHeaders(),
      },
      body: formData as any,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI STT error: ${error}`);
    }

    const data = await response.json();

    if (format === 'verbose_json') {
      return {
        text: data.text,
        language: data.language,
        duration: data.duration,
        segments: data.segments,
        model,
      };
    } else {
      return {
        text: data.text || data,
        language: data.language,
        duration: data.duration,
        model,
      };
    }
  } catch (error) {
    console.error('STT transcription error:', error);
    return {
      text: '',
      model: request.options?.model || 'whisper-1',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function mapModel(model: string): string {
  const modelMap: Record<string, string> = {
    'whisper-1': 'whisper-1',
    'gpt-4o-transcribe': 'whisper-1', // Fallback until available
    'gpt-4o-mini-transcribe': 'whisper-1', // Fallback until available
  };
  return modelMap[model] || 'whisper-1';
}

export function registerSTTHandlers(): void {
  ipcMain.handle('stt:transcribe', async (_event: IpcMainInvokeEvent, request: STTRequest): Promise<STTResponse> => {
    return transcribe(request);
  });
}