import { AICommunicationManager } from './manager';
import { listAgents, listModels, listProviders } from '@features/admin/service';
import type { 
  AIMessage, 
  CommunicationOptions, 
  AIResponse, 
  StreamEvent,
  AgentContext
} from './types';

class AICommunicationService {
  private manager: AICommunicationManager;

  constructor() {
    this.manager = new AICommunicationManager();
  }

  async sendMessageToAgent(
    agentId: number, 
    content: string, 
    options: CommunicationOptions = {}
  ): Promise<AIResponse> {
    try {
      const agentContext = await this.loadAgentContext(agentId);
      const userMessage: AIMessage = {
        role: 'user',
        content,
        metadata: { timestamp: Date.now() }
      };

      return await this.manager.communicateWithAgent(agentContext, [userMessage], options);
    } catch (error) {
      console.error('Error sending message to agent:', error);
      throw this.handleServiceError(error);
    }
  }

  async *streamMessageToAgent(
    agentId: number, 
    content: string, 
    options: CommunicationOptions = {}
  ): AsyncIterableIterator<StreamEvent> {
    try {
      const agentContext = await this.loadAgentContext(agentId);
      const userMessage: AIMessage = {
        role: 'user',
        content,
        metadata: { timestamp: Date.now() }
      };

      yield* this.manager.streamWithAgent(agentContext, [userMessage], options);
    } catch (error) {
      console.error('Error streaming message to agent:', error);
      yield {
        type: 'error',
        error: this.handleServiceError(error)
      };
    }
  }

  async sendConversationToAgent(
    agentId: number, 
    messages: AIMessage[], 
    options: CommunicationOptions = {}
  ): Promise<AIResponse> {
    try {
      const agentContext = await this.loadAgentContext(agentId);
      return await this.manager.communicateWithAgent(agentContext, messages, options);
    } catch (error) {
      console.error('Error sending conversation to agent:', error);
      throw this.handleServiceError(error);
    }
  }

  async *streamConversationToAgent(
    agentId: number, 
    messages: AIMessage[], 
    options: CommunicationOptions = {}
  ): AsyncIterableIterator<StreamEvent> {
    try {
      const agentContext = await this.loadAgentContext(agentId);
      yield* this.manager.streamWithAgent(agentContext, messages, options);
    } catch (error) {
      console.error('Error streaming conversation to agent:', error);
      yield {
        type: 'error',
        error: this.handleServiceError(error)
      };
    }
  }

  async validateAgent(agentId: number): Promise<boolean> {
    try {
      const agentContext = await this.loadAgentContext(agentId);
      return await this.manager.validateAgentConfiguration(agentContext);
    } catch (error) {
      console.error('Error validating agent:', error);
      return false;
    }
  }

  async getAgentContext(agentId: number): Promise<AgentContext> {
    return await this.loadAgentContext(agentId);
  }

  clearCache(): void {
    this.manager.clearAdapterCache();
  }

  getCacheStats(): { adapterCacheSize: number } {
    return {
      adapterCacheSize: this.manager.getAdapterCacheSize()
    };
  }

  private async loadAgentContext(agentId: number): Promise<AgentContext> {
    const [agents, models, providers] = await Promise.all([
      listAgents(),
      listModels(),
      listProviders()
    ]);
    
    const agent = agents.find((a: any) => a.id === agentId);
    
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    if (!agent.modelId) {
      throw new Error(`Agent ${agentId} does not have an associated model`);
    }

    const model = models.find((m: any) => m.id === agent.modelId);
    if (!model) {
      throw new Error(`Model with ID ${agent.modelId} not found`);
    }

    const provider = providers.find((p: any) => p.id === model.providerId);
    if (!provider) {
      throw new Error(`Provider with ID ${model.providerId} not found`);
    }

    return {
      agent,
      model,
      provider
    };
  }

  private handleServiceError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }
    
    if (typeof error === 'string') {
      return new Error(error);
    }

    if (error?.message) {
      return new Error(error.message);
    }

    return new Error('Unknown error occurred in AI communication service');
  }
}

export const aiCommunicationService = new AICommunicationService();