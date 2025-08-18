export class ResponseParser {
  static parseJsonPath(obj: any, path: string): any {
    try {
      if (!obj || !path) {
        return null;
      }

      return path.split('.').reduce((current, key) => {
        if (current === null || current === undefined) {
          return null;
        }

        if (key.includes('[') && key.includes(']')) {
          const arrayKey = key.substring(0, key.indexOf('['));
          const indexMatch = key.match(/\[(\d+)\]/);
          
          if (indexMatch) {
            const index = parseInt(indexMatch[1]);
            return current[arrayKey]?.[index];
          }
        }
        
        return current[key];
      }, obj);
    } catch (error) {
      console.error(`Error parsing JSON path "${path}":`, error);
      return null;
    }
  }

  static extractContent(response: any, messageLocation: string): string {
    const content = this.parseJsonPath(response, messageLocation);
    
    if (typeof content === 'string') {
      return content;
    }
    
    if (content && typeof content === 'object' && content.text) {
      return content.text;
    }
    
    return '';
  }

  static extractStreamContent(chunk: any, streamLocation: string): string {
    const content = this.parseJsonPath(chunk, streamLocation);
    
    if (typeof content === 'string') {
      return content;
    }
    
    return '';
  }

  static extractUsage(response: any, inputLocation?: string, outputLocation?: string): {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  } | undefined {
    try {
      const inputTokens = inputLocation ? this.parseJsonPath(response, inputLocation) : 0;
      const outputTokens = outputLocation ? this.parseJsonPath(response, outputLocation) : 0;
      
      if (inputTokens !== null || outputTokens !== null) {
        const input = inputTokens || 0;
        const output = outputTokens || 0;
        
        return {
          inputTokens: input,
          outputTokens: output,
          totalTokens: input + output
        };
      }
      
      return undefined;
    } catch (error) {
      console.error('Error extracting usage information:', error);
      return undefined;
    }
  }

  static parseStreamChunk(chunk: string, format: 'openai' | 'anthropic' = 'openai'): any {
    try {
      if (format === 'openai') {
        if (chunk.startsWith('data: ')) {
          const data = chunk.substring(6);
          
          if (data === '[DONE]') {
            return { done: true };
          }
          
          return JSON.parse(data);
        }
      } else if (format === 'anthropic') {
        if (chunk.startsWith('data: ')) {
          const data = chunk.substring(6);
          return JSON.parse(data);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing stream chunk:', error);
      return null;
    }
  }

  static formatError(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.error?.message) {
      return error.error.message;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    return 'Unknown error occurred';
  }

  static parseErrorResponse(response: any): string {
    try {
      if (response?.error) {
        if (typeof response.error === 'string') {
          return response.error;
        }
        
        if (response.error.message) {
          return response.error.message;
        }
        
        if (response.error.type && response.error.code) {
          return `${response.error.type}: ${response.error.code}`;
        }
      }
      
      if (response?.message) {
        return response.message;
      }
      
      return 'API request failed';
    } catch (error) {
      return 'Failed to parse error response';
    }
  }

  static validateResponse(response: any, expectedPaths: string[]): boolean {
    try {
      for (const path of expectedPaths) {
        const value = this.parseJsonPath(response, path);
        if (value === null || value === undefined) {
          return false;
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  static normalizeResponse(response: any, providerCode: string): any {
    switch (providerCode) {
      case 'openai':
        return this.normalizeOpenAIResponse(response);
      case 'anthropic':
        return this.normalizeAnthropicResponse(response);
      default:
        return response;
    }
  }

  private static normalizeOpenAIResponse(response: any): any {
    return {
      content: response?.choices?.[0]?.message?.content || '',
      usage: response?.usage,
      metadata: {
        model: response?.model,
        id: response?.id,
        created: response?.created,
        finishReason: response?.choices?.[0]?.finish_reason
      }
    };
  }

  private static normalizeAnthropicResponse(response: any): any {
    return {
      content: response?.content?.[0]?.text || '',
      usage: response?.usage,
      metadata: {
        model: response?.model,
        id: response?.id,
        type: response?.type,
        role: response?.role,
        stopReason: response?.stop_reason
      }
    };
  }
}