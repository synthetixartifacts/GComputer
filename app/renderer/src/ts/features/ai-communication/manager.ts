import { OpenAIAdapter } from './adapters/openai';
import { AnthropicAdapter } from './adapters/anthropic';
import { BaseProviderAdapter } from './adapters/base';
import type { 
  AIMessage, 
  CommunicationOptions, 
  AIResponse, 
  StreamEvent,
  AgentContext,
  ProviderCode,
  ProviderConfiguration,
  ModelConfiguration,
  AgentConfiguration
} from './types';
import type { Agent, Model, Provider } from '@features/admin/types';

export class AICommunicationManager {
  private adapters: Map<string, BaseProviderAdapter> = new Map();

  async communicateWithAgent(
    agentContext: AgentContext, 
    userMessages: AIMessage[], 
    options: CommunicationOptions = {}
  ): Promise<AIResponse> {
    const adapter = this.getAdapterForProvider(agentContext);
    const messages = this.prepareMessages(agentContext, userMessages);
    
    return await adapter.sendMessage(messages, options);
  }

  async *streamWithAgent(
    agentContext: AgentContext, 
    userMessages: AIMessage[], 
    options: CommunicationOptions = {}
  ): AsyncIterableIterator<StreamEvent> {
    const adapter = this.getAdapterForProvider(agentContext);
    const messages = this.prepareMessages(agentContext, userMessages);
    
    yield* adapter.streamMessage(messages, { ...options, stream: true });
  }

  async validateAgentConfiguration(agentContext: AgentContext): Promise<boolean> {
    try {
      const adapter = this.getAdapterForProvider(agentContext);
      return await adapter.validateConfiguration();
    } catch (error) {
      console.error('Agent configuration validation failed:', error);
      return false;
    }
  }

  private getAdapterForProvider(agentContext: AgentContext): BaseProviderAdapter {
    const { provider, model } = agentContext;
    const adapterKey = `${provider.code}-${model.id}`;
    
    if (this.adapters.has(adapterKey)) {
      return this.adapters.get(adapterKey)!;
    }

    const adapter = this.createAdapter(provider, model);
    this.adapters.set(adapterKey, adapter);
    
    return adapter;
  }

  private createAdapter(provider: Provider, model: Model): BaseProviderAdapter {
    const providerConfig: ProviderConfiguration = {
      authentication: provider.authentication as 'bearer' | 'x-api-key' | 'custom',
      secretKey: provider.secretKey || '',
      url: provider.url,
      configuration: provider.configuration ? JSON.parse(provider.configuration) : undefined
    };

    const modelConfig: ModelConfiguration = {
      model: model.model,
      endpoint: model.endpoint || '/v1/chat/completions',
      params: model.params ? JSON.parse(model.params) : {},
      messageLocation: model.messageLocation || 'choices[0].message.content',
      messageStreamLocation: model.messageStreamLocation || undefined,
      inputTokenCountLocation: model.inputTokenCountLocation || undefined,
      outputTokenCountLocation: model.outputTokenCountLocation || undefined
    };

    switch (provider.code as ProviderCode) {
      case 'openai':
        return new OpenAIAdapter(providerConfig, modelConfig);
      case 'anthropic':
        return new AnthropicAdapter(providerConfig, modelConfig);
      default:
        throw new Error(`Unsupported provider: ${provider.code}`);
    }
  }

  private prepareMessages(agentContext: AgentContext, userMessages: AIMessage[]): AIMessage[] {
    const { agent } = agentContext;
    const messages: AIMessage[] = [];

    if (agent.systemPrompt && agent.systemPrompt.trim() !== '') {
      messages.push({
        role: 'system',
        content: agent.systemPrompt,
        metadata: { source: 'agent' }
      });
    }

    messages.push(...userMessages);

    return messages;
  }

  clearAdapterCache(): void {
    this.adapters.clear();
  }

  getAdapterCacheSize(): number {
    return this.adapters.size;
  }
}