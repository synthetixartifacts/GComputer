<script lang="ts">
  /**
   * DiscussionContainer Component
   * 
   * Purpose: Smart container for AI discussions with database persistence
   * 
   * Responsibilities:
   * - Manage discussion lifecycle (create, load, update)
   * - Handle AI communication through agents
   * - Persist messages to database
   * - Coordinate between discussion state and chatbot UI
   * - Agent validation and error handling
   * - Stream AI responses with proper state management
   * 
   * Use when: You need AI-powered conversations that persist to database
   * Wraps ChatThread for UI, adds business logic for discussions
   * 
   * This is the ONLY component that should handle discussion persistence.
   * Do not duplicate this logic elsewhere.
   */
  import { onMount, onDestroy } from 'svelte';
  import DiscussionHeader from './DiscussionHeader.svelte';
  import ChatThread from '@components/chat/ChatThread.svelte';
  import type { DiscussionWithMessages, Message } from '@features/discussion/types';
  import type { Agent } from '@features/admin/types';
  import { discussionStateManager } from '@features/discussion/state-manager';
  import { discussionService } from '@features/discussion/service';
  import { aiCommunicationService } from '@features/ai-communication/service';
  import type { AIMessage } from '@features/ai-communication/types';
  import { chatbotStore } from '@features/chatbot/store';
  import { generateId, nowIso } from '@features/chatbot/service';
  import type { ChatMessage } from '@features/chatbot/types';
  import { prepareAIMessages, DiscussionError } from '@features/discussion/utils';
  import { t } from '@ts/i18n';
  
  export let discussion: DiscussionWithMessages | null = null;
  export let agent: Agent | null = null;
  export let onDiscussionCreated: ((discussion: DiscussionWithMessages) => void) | null = null;
  export let onTitleChange: ((title: string) => void) | null = null;
  export let onFavoriteToggle: (() => void) | null = null;
  
  // State from manager
  let messages: Message[] = [];
  let isStreaming = false;
  let userMessageCount = 0;
  let error: string | null = null;
  let threadId: string | null = null;
  
  // Local state
  let isInitialized = false;
  
  // Subscriptions
  const unsubMessages = discussionStateManager.messages$.subscribe(m => messages = m);
  const unsubStreaming = discussionStateManager.isStreaming$.subscribe(s => isStreaming = s);
  const unsubCount = discussionStateManager.userMessageCount$.subscribe(c => userMessageCount = c);
  const unsubState = discussionStateManager.subscribe(state => {
    threadId = state.threadId;
  });
  
  onMount(async () => {
    await initialize();
  });
  
  onDestroy(() => {
    unsubMessages();
    unsubStreaming();
    unsubCount();
    unsubState();
    discussionStateManager.clearDiscussion();
  });
  
  async function initialize(): Promise<void> {
    if (!agent && !discussion?.agent) {
      error = 'No agent configured';
      return;
    }
    
    const activeAgent = discussion?.agent || agent;
    
    // Initialize state manager
    await discussionStateManager.initializeDiscussion(discussion, activeAgent);
    
    // Validate agent
    if (activeAgent) {
      try {
        const isValid = await aiCommunicationService.validateAgent(activeAgent.id);
        if (!isValid) {
          error = 'Agent validation failed. Please check API configuration.';
        }
      } catch (err) {
        console.error('Agent validation error:', err);
        error = 'Failed to validate agent';
      }
    }
    
    isInitialized = true;
  }
  
  async function handleSendMessage(message: string): Promise<void> {
    if (!message.trim() || isStreaming) return;
    
    const state = discussionStateManager.getState();
    const activeAgent = state.activeAgent;
    
    if (!activeAgent) {
      error = 'No agent configured';
      return;
    }
    
    try {
      // Create discussion if needed
      let currentDiscussion = state.activeDiscussion;
      
      if (!currentDiscussion) {
        const newDiscussion = await discussionStateManager.createDiscussion(
          activeAgent.id,
          message
        );
        
        if (!newDiscussion) {
          error = 'Failed to create discussion';
          return;
        }
        
        // Attach agent to discussion for reference
        newDiscussion.agent = activeAgent;
        discussion = newDiscussion;
        currentDiscussion = newDiscussion;
        
        if (onDiscussionCreated) {
          onDiscussionCreated(newDiscussion);
        }
      }
      
      // Save user message
      const userMessage = await discussionService.createMessage({
        who: 'user',
        content: message,
        discussionId: currentDiscussion.id,
      });
      
      // Prepare AI messages BEFORE adding to state (to avoid including current message in history)
      const aiMessages = prepareAIMessages(message, messages, state.useMemory);
      
      // Add to state immediately for UI feedback
      await discussionStateManager.addMessage(userMessage);
      
      // Start streaming
      discussionStateManager.setStreaming(true);
      
      // Create a placeholder message for streaming
      const streamingMsgId = generateId('assistant');
      const streamingMessage: ChatMessage = {
        id: streamingMsgId,
        role: 'assistant',
        content: '',
        createdAtIso: nowIso()
      };
      
      // Get updated state to ensure we have the correct threadId
      const updatedState = discussionStateManager.getState();
      const currentThreadId = updatedState.threadId || `discussion-${currentDiscussion.id}`;
      chatbotStore.addMessageDirectly(currentThreadId, streamingMessage);
      
      let fullContent = '';
      
      // Stream AI response
      const stream = aiCommunicationService.streamConversationToAgent(
        activeAgent.id,
        aiMessages,
        { stream: true }
      );
      
      for await (const event of stream) {
        if (event.type === 'chunk' && event.data) {
          fullContent += event.data;
          // Update the streaming message with accumulated content
          chatbotStore.updateMessage(currentThreadId, streamingMsgId, fullContent);
        } else if (event.type === 'complete') {
          // Save AI response
          const aiMessage = await discussionService.createMessage({
            who: 'agent',
            content: fullContent,
            discussionId: currentDiscussion.id,
          });
          
          // Update the message ID in the chatbot store to prevent duplication
          // This keeps the same message object but updates its ID to match the database
          const finalMessageId = `msg-${aiMessage.id}`;
          chatbotStore.updateMessageId(currentThreadId, streamingMsgId, finalMessageId);
          
          // Add to state manager but skip chatbot store since message is already there
          await discussionStateManager.addMessage(aiMessage, true);
          break;
        } else if (event.type === 'error') {
          error = event.error?.message || 'Stream error';
          // Remove the failed streaming message
          chatbotStore.removeMessage(currentThreadId, streamingMsgId);
          break;
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      const discussionError = DiscussionError.from(err);
      error = discussionError.message;
    } finally {
      discussionStateManager.setStreaming(false);
    }
  }
  
  function handleStop(): void {
    // TODO: Implement stream cancellation
    discussionStateManager.setStreaming(false);
  }
</script>

<div class="discussion-container">
  {#if error}
    <div class="error-banner">
      {error}
      <button on:click={() => error = null}>×</button>
    </div>
  {/if}
  
  {#if discussion}
    <DiscussionHeader
      {discussion}
      messageCount={userMessageCount}
      {onTitleChange}
      {onFavoriteToggle}
    />
  {:else if agent}
    <div class="new-discussion-header">
      <h2>{$t('discussion.newChat')}</h2>
      <p>{$t('discussion.chattingWith', { agent: agent.name })}</p>
    </div>
  {/if}
  
  <div class="discussion-content">
    {#if threadId}
      <ChatThread
        {threadId}
        {isStreaming}
        customSendHandler={handleSendMessage}
        copyKey="discussion.chat.messages.copy"
        copiedKey="discussion.chat.messages.copied"
        placeholderKey="discussion.chat.composer.placeholder"
        inputLabelKey="discussion.chat.composer.inputLabel"
        sendKey="discussion.chat.composer.send"
      />
    {/if}
  </div>
</div>