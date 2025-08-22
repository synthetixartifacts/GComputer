import { aiCommunicationService } from '@features/ai-communication/service';
import { chatbotStore } from '@features/chatbot/store';
import { generateId, nowIso } from '@features/chatbot/service';
import { discussionService } from './service';
import type { ChatMessage } from '@features/chatbot/types';
import type { AIMessage, StreamEvent } from '@features/ai-communication/types';
import type { DiscussionWithMessages, Message } from './types';
import type { Agent } from '@features/admin/types';

export interface DiscussionChatbotBridgeOptions {
  onMessageSaved?: (message: Message) => void;
  onDiscussionCreated?: (discussion: DiscussionWithMessages) => void;
  onError?: (error: Error) => void;
}

export class DiscussionChatbotBridge {
  private discussion: DiscussionWithMessages | null = null;
  private isStreaming: boolean = false;
  private options: DiscussionChatbotBridgeOptions;
  private agentId: number | null = null;
  private agent: Agent | null = null;

  constructor(options: DiscussionChatbotBridgeOptions = {}) {
    this.options = options;
  }

  /**
   * Initialize the bridge with a discussion and sync existing messages
   */
  async initialize(discussion: DiscussionWithMessages | null, threadId: string, agent?: Agent): Promise<void> {
    this.discussion = discussion;
    this.agent = agent || (discussion?.agent as Agent) || null;
    this.agentId = this.agent?.id || null;
    
    // Set the thread as active
    chatbotStore.setActiveThread(threadId);
    
    if (discussion && discussion.messages.length > 0) {
      // Convert and sync existing discussion messages to chatbot store
      const chatMessages: ChatMessage[] = discussion.messages.map(msg => ({
        id: `msg-${msg.id}`,
        role: msg.who === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
        createdAtIso: new Date(msg.createdAt).toISOString()
      }));
      
      // Replace thread messages with discussion history
      chatbotStore.replaceThreadMessages(threadId, chatMessages);
    } else {
      // Clear messages for new discussion
      chatbotStore.replaceThreadMessages(threadId, []);
    }
  }

  /**
   * Send a message with discussion persistence and memory support
   */
  async sendMessage(threadId: string, content: string, useMemory: boolean = false): Promise<void> {
    // Check if we need to create a discussion first
    if (!this.discussion && this.agentId && this.agent) {
      try {
        // Create a new discussion with the first message
        const newDiscussion = await discussionService.createNewDiscussionWithAgent(
          this.agentId,
          content.substring(0, 50) + (content.length > 50 ? '...' : '') // Use first message as title
        );
        
        // Add the agent to the discussion object since it's not populated
        newDiscussion.agent = this.agent;
        this.discussion = newDiscussion;
        
        // Notify parent about the new discussion
        if (this.options.onDiscussionCreated) {
          this.options.onDiscussionCreated(newDiscussion);
        }
      } catch (error) {
        this.handleError(new Error('Failed to create discussion'));
        return;
      }
    }

    // Check we have everything needed
    const activeAgent = this.discussion?.agent || this.agent;
    if (!this.discussion || !activeAgent) {
      this.handleError(new Error('No discussion or agent configured'));
      return;
    }

    if (this.isStreaming) {
      return; // Prevent multiple simultaneous requests
    }

    try {
      this.isStreaming = true;

      // Save user message to database first
      const userMessage = await discussionService.createMessage({
        who: 'user',
        content,
        discussionId: this.discussion.id,
      });

      // Add to local discussion messages
      this.discussion.messages.push(userMessage);

      // Add user message to chatbot store for immediate UI update
      chatbotStore.addUserMessage(threadId, content);

      // Notify callback if provided
      if (this.options.onMessageSaved) {
        this.options.onMessageSaved(userMessage);
      }

      // Prepare AI messages with memory if needed
      const aiMessages = this.prepareAIMessages(content, useMemory);

      // Handle streaming response
      await this.handleStreamingResponse(threadId, aiMessages);
      
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      this.isStreaming = false;
    }
  }

  /**
   * Prepare AI messages with conversation history if memory is enabled
   */
  private prepareAIMessages(currentMessage: string, useMemory: boolean): AIMessage[] {
    const messages: AIMessage[] = [];

    if (useMemory && this.discussion && this.discussion.messages.length > 1) {
      // Build conversation history (excluding the just-added user message)
      const historyMessages = this.discussion.messages.slice(0, -1);
      
      if (historyMessages.length > 0) {
        const historyLines: string[] = [];
        historyLines.push('<conversation_history>');
        
        historyMessages.forEach(msg => {
          const role = msg.who === 'user' ? '## User' : '## AI Agent';
          historyLines.push(role);
          historyLines.push(msg.content);
          historyLines.push('');
        });
        
        historyLines.push('</conversation_history>');
        historyLines.push('');
        historyLines.push('# New User message to answer to');
        historyLines.push(currentMessage);
        
        messages.push({
          role: 'user',
          content: historyLines.join('\n')
        });
      } else {
        messages.push({
          role: 'user',
          content: currentMessage
        });
      }
    } else {
      messages.push({
        role: 'user',
        content: currentMessage
      });
    }

    return messages;
  }

  /**
   * Handle streaming AI response with database persistence
   */
  private async handleStreamingResponse(threadId: string, messages: AIMessage[]): Promise<void> {
    const activeAgent = this.discussion?.agent || this.agent;
    if (!this.discussion || !activeAgent) return;

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
      const stream = aiCommunicationService.streamConversationToAgent(
        activeAgent.id,
        messages,
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
          // Save the complete agent message to database
          const agentMessage = await discussionService.createMessage({
            who: 'agent',
            content: fullContent,
            discussionId: this.discussion.id,
          });

          // Add to local discussion messages
          this.discussion.messages.push(agentMessage);

          // Update the message ID to match the saved message
          // This ensures consistency between UI and database
          chatbotStore.updateMessage(threadId, streamingMessageId, fullContent);

          // Notify callback if provided
          if (this.options.onMessageSaved) {
            this.options.onMessageSaved(agentMessage);
          }
          
          break;
        }
      }
    } catch (error) {
      // Remove the failed streaming message and show error
      chatbotStore.removeMessage(threadId, streamingMessageId);
      this.addErrorMessage(threadId, error instanceof Error ? error.message : 'Stream error');
      throw error;
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
   * Handle and report errors
   */
  private handleError(error: Error): void {
    console.error('DiscussionChatbotBridge error:', error);
    if (this.options.onError) {
      this.options.onError(error);
    }
  }

  /**
   * Get current streaming status
   */
  getStreamingStatus(): boolean {
    return this.isStreaming;
  }

  /**
   * Get current discussion
   */
  getCurrentDiscussion(): DiscussionWithMessages | null {
    return this.discussion;
  }

  /**
   * Update the current discussion (e.g., after external changes)
   */
  updateDiscussion(discussion: DiscussionWithMessages): void {
    this.discussion = discussion;
  }
}