import type { 
  ProviderAdapter, 
  AIMessage, 
  CommunicationOptions, 
  AIResponse, 
  StreamEvent,
  AgentContext,
  ProviderConfiguration,
  ModelConfiguration
} from '../types';

export abstract class BaseProviderAdapter implements ProviderAdapter {
  protected provider: ProviderConfiguration;
  protected model: ModelConfiguration;

  constructor(provider: ProviderConfiguration, model: ModelConfiguration) {
    this.provider = provider;
    this.model = model;
  }

  abstract sendMessage(messages: AIMessage[], options: CommunicationOptions): Promise<AIResponse>;
  abstract streamMessage(messages: AIMessage[], options: CommunicationOptions): AsyncIterableIterator<StreamEvent>;
  abstract validateConfiguration(): Promise<boolean>;

  protected buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    switch (this.provider.authentication) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${this.provider.secretKey}`;
        break;
      case 'x-api-key':
        headers['x-api-key'] = this.provider.secretKey;
        break;
      case 'custom':
        if (this.provider.configuration?.headers) {
          Object.assign(headers, this.provider.configuration.headers);
        }
        break;
    }

    return headers;
  }

  protected buildUrl(endpoint?: string): string {
    const baseUrl = this.provider.url.replace(/\/$/, '');
    const modelEndpoint = endpoint || this.model.endpoint;
    return `${baseUrl}${modelEndpoint}`;
  }

  protected formatMessages(messages: AIMessage[]): any {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  protected buildRequestBody(messages: AIMessage[], options: CommunicationOptions): any {
    const body: any = {
      ...this.model.params,
      messages: this.formatMessages(messages),
      stream: options.stream || false
    };

    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    }

    if (options.maxTokens !== undefined) {
      body.max_tokens = options.maxTokens;
    }

    if (options.additionalParams) {
      Object.assign(body, options.additionalParams);
    }

    return body;
  }

  protected extractContent(response: any): string {
    try {
      return this.getValueFromPath(response, this.model.messageLocation) || '';
    } catch (error) {
      console.error('Error extracting content from response:', error);
      return '';
    }
  }

  protected extractStreamContent(chunk: any): string {
    try {
      if (!this.model.messageStreamLocation) {
        return this.extractContent(chunk);
      }
      return this.getValueFromPath(chunk, this.model.messageStreamLocation) || '';
    } catch (error) {
      console.error('Error extracting stream content from chunk:', error);
      return '';
    }
  }

  protected extractUsage(response: any): AIResponse['usage'] {
    try {
      const inputTokens = this.model.inputTokenCountLocation 
        ? this.getValueFromPath(response, this.model.inputTokenCountLocation) 
        : 0;
      const outputTokens = this.model.outputTokenCountLocation 
        ? this.getValueFromPath(response, this.model.outputTokenCountLocation) 
        : 0;

      return {
        inputTokens: inputTokens || 0,
        outputTokens: outputTokens || 0,
        totalTokens: (inputTokens || 0) + (outputTokens || 0)
      };
    } catch (error) {
      console.error('Error extracting usage from response:', error);
      return undefined;
    }
  }

  private getValueFromPath(obj: any, path: string): any {
    try {
      return path.split('.').reduce((current, key) => {
        if (key.includes('[') && key.includes(']')) {
          const arrayKey = key.substring(0, key.indexOf('['));
          const index = parseInt(key.substring(key.indexOf('[') + 1, key.indexOf(']')));
          return current?.[arrayKey]?.[index];
        }
        return current?.[key];
      }, obj);
    } catch (error) {
      console.error(`Error getting value from path "${path}":`, error);
      return null;
    }
  }

  protected handleError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }
    
    if (typeof error === 'string') {
      return new Error(error);
    }

    if (error?.message) {
      return new Error(error.message);
    }

    return new Error('Unknown error occurred during AI communication');
  }

  protected async validateApiKey(): Promise<boolean> {
    if (!this.provider.secretKey || this.provider.secretKey.trim() === '') {
      return false;
    }
    return true;
  }
}