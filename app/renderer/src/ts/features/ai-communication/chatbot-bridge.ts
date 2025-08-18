import { aiCommunicationService } from './service';
import { chatbotStore } from '@features/chatbot/store';
import { generateId, nowIso } from '@features/chatbot/service';
import type { ChatMessage } from '@features/chatbot/types';
import type { AIMessage, StreamEvent } from './types';

export class AIChatbotBridge {
  private currentAgent: number | null = null;
  private isStreaming: boolean = false;
  private tokenUsage = { input: 0, output: 0, total: 0 };

  /**
   * Set the active agent for AI communication
   */
  setActiveAgent(agentId: number | null): void {
    this.currentAgent = agentId;
  }

  /**
   * Send a message to the AI agent and handle the response in the chatbot store
   */
  async sendMessage(threadId: string, content: string, useStreaming: boolean = true): Promise<void> {
    if (!this.currentAgent) {
      this.addErrorMessage(threadId, 'No AI agent selected. Please select an agent first.');
      return;
    }

    // Add user message to chatbot store
    chatbotStore.addUserMessage(threadId, content);

    try {
      if (useStreaming) {
        await this.handleStreamingResponse(threadId, content);
      } else {
        await this.handleNormalResponse(threadId, content);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      this.addErrorMessage(threadId, `AI Error: ${errorMsg}`);
    }
  }

  /**
   * Handle non-streaming AI response
   */
  private async handleNormalResponse(threadId: string, content: string): Promise<void> {
    const response = await aiCommunicationService.sendMessageToAgent(
      this.currentAgent!,
      content,
      { stream: false }
    );

    // Update token usage
    if (response.usage) {
      this.tokenUsage.input += response.usage.inputTokens;
      this.tokenUsage.output += response.usage.outputTokens;
      this.tokenUsage.total += response.usage.totalTokens;
    }

    chatbotStore.addAssistantMessage(threadId, response.content);
  }

  /**
   * Handle streaming AI response
   */
  private async handleStreamingResponse(threadId: string, content: string): Promise<void> {
    this.isStreaming = true;
    
    // Create a placeholder message for streaming content
    const streamingMessageId = generateId('assistant');
    const streamingMessage: ChatMessage = {
      id: streamingMessageId,
      role: 'assistant',
      content: '',
      createdAtIso: nowIso()
    };

    // Add empty assistant message to start streaming
    chatbotStore.addMessageDirectly(threadId, streamingMessage);

    let fullContent = '';

    try {
      const stream = aiCommunicationService.streamMessageToAgent(
        this.currentAgent!,
        content,
        { stream: true }
      );

      for await (const chunk of stream) {
        if (chunk.type === 'chunk' && chunk.data) {
          fullContent += chunk.data;
          // Update the streaming message with accumulated content
          chatbotStore.updateMessage(threadId, streamingMessageId, fullContent);
        } else if (chunk.type === 'error') {
          throw chunk.error || new Error('Stream error');
        } else if (chunk.type === 'complete') {
          // Streaming complete
          break;
        }
      }
    } catch (error) {
      // Remove the failed streaming message and add error
      chatbotStore.removeMessage(threadId, streamingMessageId);
      throw error;
    } finally {
      this.isStreaming = false;
    }
  }

  /**
   * Add an error message to the chatbot thread
   */
  private addErrorMessage(threadId: string, errorText: string): void {
    const errorMessage: ChatMessage = {
      id: generateId('error'),
      role: 'assistant',
      content: `⚠️ ${errorText}`,
      createdAtIso: nowIso()
    };
    chatbotStore.addMessageDirectly(threadId, errorMessage);
  }

  /**
   * Convert AI message format to ChatMessage format
   */
  private aiMessageToChatMessage(aiMessage: AIMessage): ChatMessage {
    return {
      id: generateId(aiMessage.role),
      role: aiMessage.role === 'system' ? 'assistant' : aiMessage.role,
      content: aiMessage.content,
      createdAtIso: nowIso()
    };
  }

  /**
   * Get current streaming status
   */
  getStreamingStatus(): boolean {
    return this.isStreaming;
  }

  /**
   * Get current agent ID
   */
  getCurrentAgent(): number | null {
    return this.currentAgent;
  }

  /**
   * Get token usage statistics
   */
  getTokenUsage(): { input: number, output: number, total: number } {
    return { ...this.tokenUsage };
  }

  /**
   * Reset token usage
   */
  resetTokenUsage(): void {
    this.tokenUsage = { input: 0, output: 0, total: 0 };
  }
}