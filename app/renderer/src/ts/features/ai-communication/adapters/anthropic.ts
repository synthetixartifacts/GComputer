import Anthropic from '@anthropic-ai/sdk';
import { BaseProviderAdapter } from './base';
import type { 
  AIMessage, 
  CommunicationOptions, 
  AIResponse, 
  StreamEvent,
  ProviderConfiguration,
  ModelConfiguration
} from '../types';

export class AnthropicAdapter extends BaseProviderAdapter {
  private client?: Anthropic;

  constructor(provider: ProviderConfiguration, model: ModelConfiguration) {
    super(provider, model, 'anthropic');
  }

  private async getClient(): Promise<Anthropic> {
    if (this.client) {
      return this.client;
    }

    const secretKey = await this.getSecretKey();
    if (!secretKey) {
      throw new Error('Anthropic API key not found in database or environment');
    }

    this.client = new Anthropic({
      apiKey: secretKey,
      baseURL: this.provider.url !== 'https://api.anthropic.com' ? this.provider.url : undefined,
      dangerouslyAllowBrowser: true
    });

    return this.client;
  }

  async sendMessage(messages: AIMessage[], options: CommunicationOptions): Promise<AIResponse> {
    try {
      const requestBody = this.buildAnthropicRequestBody(messages, options);
      const client = await this.getClient();
      
      const response = await client.messages.create(requestBody) as Anthropic.Messages.Message;
      
      const content = this.extractContent(response);
      const usage = this.extractUsage(response);
      
      return {
        content,
        usage,
        metadata: {
          model: response.model,
          id: response.id,
          type: response.type,
          role: response.role,
          stopReason: response.stop_reason,
          stopSequence: response.stop_sequence
        }
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async *streamMessage(messages: AIMessage[], options: CommunicationOptions): AsyncIterableIterator<StreamEvent> {
    try {
      const requestBody = this.buildAnthropicRequestBody(messages, { ...options, stream: true });
      const client = await this.getClient();
      
      const stream = await client.messages.create(requestBody) as any;
      
      let fullContent = '';
      
      for await (const chunk of stream) {
        try {
          if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
            const content = chunk.delta.text;
            if (content) {
              fullContent += content;
              yield {
                type: 'chunk',
                data: content
              };
            }
          } else if (chunk.type === 'message_stop') {
            yield {
              type: 'complete',
              data: fullContent
            };
            break;
          } else if (chunk.type === 'error') {
            yield {
              type: 'error',
              error: this.handleError(chunk.error)
            };
          }
        } catch (chunkError) {
          console.error('Error processing Anthropic stream chunk:', chunkError);
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

      const client = await this.getClient();
      await client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      });
      
      return true;
    } catch (error) {
      console.error('Anthropic configuration validation failed:', error);
      return false;
    }
  }

  private buildAnthropicRequestBody(messages: AIMessage[], options: CommunicationOptions): Anthropic.Messages.MessageCreateParams {
    const baseBody = this.buildRequestBody(messages, options);
    const formattedMessages = this.formatAnthropicMessages(messages);
    
    return {
      model: baseBody.model,
      max_tokens: options.maxTokens ?? baseBody.max_tokens ?? 1024,
      messages: formattedMessages.messages,
      system: formattedMessages.system,
      stream: options.stream || false,
      temperature: options.temperature ?? baseBody.temperature,
      ...options.additionalParams
    };
  }

  private formatAnthropicMessages(messages: AIMessage[]): { 
    messages: Anthropic.Messages.MessageParam[], 
    system?: string 
  } {
    let systemMessage: string | undefined;
    const conversationMessages: Anthropic.Messages.MessageParam[] = [];
    
    for (const msg of messages) {
      switch (msg.role) {
        case 'system':
          if (systemMessage) {
            systemMessage += '\n\n' + msg.content;
          } else {
            systemMessage = msg.content;
          }
          break;
        case 'user':
          conversationMessages.push({
            role: 'user',
            content: msg.content
          });
          break;
        case 'assistant':
          conversationMessages.push({
            role: 'assistant',
            content: msg.content
          });
          break;
        default:
          throw new Error(`Unsupported message role for Anthropic: ${msg.role}`);
      }
    }
    
    return {
      messages: conversationMessages,
      system: systemMessage
    };
  }

  protected extractContent(response: any): string {
    try {
      if (this.model.messageLocation) {
        return super.extractContent(response);
      }
      
      if (response?.content?.[0]?.text) {
        return response.content[0].text;
      }
      
      return '';
    } catch (error) {
      console.error('Error extracting Anthropic content:', error);
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
        inputTokens: usage.input_tokens || 0,
        outputTokens: usage.output_tokens || 0,
        totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0)
      };
    } catch (error) {
      console.error('Error extracting Anthropic usage:', error);
      return undefined;
    }
  }
}