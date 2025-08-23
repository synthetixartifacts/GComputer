import type { 
  ProviderAdapter, 
  AIMessage, 
  CommunicationOptions, 
  AIResponse, 
  StreamEvent,
  AgentContext,
  ProviderConfiguration,
  ModelConfiguration,
  ProviderCode
} from '../types';

export abstract class BaseProviderAdapter implements ProviderAdapter {
  protected provider: ProviderConfiguration;
  protected model: ModelConfiguration;
  protected providerCode?: ProviderCode;
  private secretKeyCache?: string;

  constructor(provider: ProviderConfiguration, model: ModelConfiguration, providerCode?: ProviderCode) {
    this.provider = provider;
    this.model = model;
    this.providerCode = providerCode;
  }

  abstract sendMessage(messages: AIMessage[], options: CommunicationOptions): Promise<AIResponse>;
  abstract streamMessage(messages: AIMessage[], options: CommunicationOptions): AsyncIterableIterator<StreamEvent>;
  abstract validateConfiguration(): Promise<boolean>;

  protected async buildHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const secretKey = await this.getSecretKey();

    switch (this.provider.authentication) {
      case 'bearer':
        if (secretKey) {
          headers['Authorization'] = `Bearer ${secretKey}`;
        }
        break;
      case 'x-api-key':
        if (secretKey) {
          headers['x-api-key'] = secretKey;
        }
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
      model: this.model.model,
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

  /**
   * Get the secret key, trying database first, then environment
   */
  protected async getSecretKey(): Promise<string | undefined> {
    // Return cached value if available
    if (this.secretKeyCache !== undefined) {
      return this.secretKeyCache || undefined;
    }

    // Try database first
    if (this.provider.secretKey && this.provider.secretKey.trim() !== '') {
      this.secretKeyCache = this.provider.secretKey;
      return this.provider.secretKey;
    }

    // Fall back to environment if provider code is available
    if (this.providerCode && window.gc?.config?.getEnv) {
      try {
        // Try common environment variable patterns for API keys
        const envKeys = [
          `${this.providerCode.toUpperCase()}_API_KEY`,
          `${this.providerCode.toUpperCase()}_KEY`,
          `${this.providerCode}_api_key`,
        ];
        
        for (const envKey of envKeys) {
          const envSecret = await window.gc.config.getEnv(envKey);
          if (envSecret && envSecret.trim() !== '') {
            this.secretKeyCache = envSecret;
            return envSecret;
          }
        }
      } catch (error) {
        console.error(`Failed to get secret for provider ${this.providerCode} from environment:`, error);
      }
    }

    // Cache the failure to avoid repeated lookups
    this.secretKeyCache = '';
    return undefined;
  }

  protected async validateApiKey(): Promise<boolean> {
    const secretKey = await this.getSecretKey();
    return !!(secretKey && secretKey.trim() !== '');
  }
}