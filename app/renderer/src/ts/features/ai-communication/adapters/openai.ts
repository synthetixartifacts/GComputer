import OpenAI from 'openai';
import type { Stream } from 'openai/streaming';
import { BaseProviderAdapter } from './base';
import type { 
  AIMessage, 
  CommunicationOptions, 
  AIResponse, 
  StreamEvent,
  ProviderConfiguration,
  ModelConfiguration
} from '../types';

export class OpenAIAdapter extends BaseProviderAdapter {
  private client: OpenAI;

  constructor(provider: ProviderConfiguration, model: ModelConfiguration) {
    super(provider, model);
    
    this.client = new OpenAI({
      apiKey: this.provider.secretKey,
      baseURL: this.provider.url !== 'https://api.openai.com' ? this.provider.url : undefined,
      organization: this.provider.configuration?.organization,
      dangerouslyAllowBrowser: true
    });
  }

  async sendMessage(messages: AIMessage[], options: CommunicationOptions): Promise<AIResponse> {
    try {
      const requestBody = this.buildOpenAIRequestBody(messages, options);
      
      const response = await this.client.chat.completions.create(requestBody) as OpenAI.Chat.Completions.ChatCompletion;
      
      const content = this.extractContent(response);
      const usage = this.extractUsage(response);
      
      return {
        content,
        usage,
        metadata: {
          model: response.model,
          id: response.id,
          created: response.created,
          finishReason: response.choices[0]?.finish_reason
        }
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async *streamMessage(messages: AIMessage[], options: CommunicationOptions): AsyncIterableIterator<StreamEvent> {
    try {
      const requestBody = this.buildOpenAIRequestBody(messages, { ...options, stream: true });
      
      const stream = await this.client.chat.completions.create(requestBody) as Stream<OpenAI.Chat.Completions.ChatCompletionChunk>;
      
      let fullContent = '';
      
      for await (const chunk of stream) {
        try {
          const content = this.extractStreamContent(chunk);
          
          if (content) {
            fullContent += content;
            yield {
              type: 'chunk',
              data: content
            };
          }
          
          if (chunk.choices[0]?.finish_reason) {
            yield {
              type: 'complete',
              data: fullContent
            };
            break;
          }
        } catch (chunkError) {
          console.error('Error processing stream chunk:', chunkError);
          yield {
            type: 'error',
            error: this.handleError(chunkError)
          };
        }
      }
    } catch (error) {
      yield {
        type: 'error',
        error: this.handleError(error)
      };
    }
  }

  async validateConfiguration(): Promise<boolean> {
    try {
      if (!await this.validateApiKey()) {
        return false;
      }

      await this.client.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI configuration validation failed:', error);
      return false;
    }
  }

  private buildOpenAIRequestBody(messages: AIMessage[], options: CommunicationOptions): OpenAI.Chat.Completions.ChatCompletionCreateParams {
    const baseBody = this.buildRequestBody(messages, options);
    
    return {
      model: baseBody.model || 'gpt-3.5-turbo',
      messages: this.formatOpenAIMessages(messages),
      stream: options.stream || false,
      temperature: options.temperature ?? baseBody.temperature,
      max_tokens: options.maxTokens ?? baseBody.max_tokens,
      ...baseBody,
      ...options.additionalParams
    };
  }

  private formatOpenAIMessages(messages: AIMessage[]): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    return messages.map(msg => {
      switch (msg.role) {
        case 'system':
          return {
            role: 'system',
            content: msg.content
          };
        case 'user':
          return {
            role: 'user',
            content: msg.content
          };
        case 'assistant':
          return {
            role: 'assistant',
            content: msg.content
          };
        default:
          throw new Error(`Unsupported message role: ${msg.role}`);
      }
    });
  }

  protected extractContent(response: any): string {
    try {
      if (this.model.messageLocation) {
        return super.extractContent(response);
      }
      
      return response?.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('Error extracting OpenAI content:', error);
      return '';
    }
  }

  protected extractStreamContent(chunk: any): string {
    try {
      if (this.model.messageStreamLocation) {
        return super.extractStreamContent(chunk);
      }
      
      return chunk?.choices?.[0]?.delta?.content || '';
    } catch (error) {
      console.error('Error extracting OpenAI stream content:', error);
      return '';
    }
  }

  protected extractUsage(response: any): AIResponse['usage'] {
    try {
      if (this.model.inputTokenCountLocation || this.model.outputTokenCountLocation) {
        return super.extractUsage(response);
      }
      
      const usage = response?.usage;
      if (!usage) return undefined;
      
      return {
        inputTokens: usage.prompt_tokens || 0,
        outputTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0
      };
    } catch (error) {
      console.error('Error extracting OpenAI usage:', error);
      return undefined;
    }
  }
}