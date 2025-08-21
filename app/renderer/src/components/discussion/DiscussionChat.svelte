<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import ChatThread from '@components/chat/ChatThread.svelte';
  import type { DiscussionWithMessages, Message } from '@features/discussion/types';
  import type { Agent } from '@features/admin/types';
  import { discussionService } from '@features/discussion/service';
  import { discussionStore } from '@features/discussion/store';
  import { aiCommunicationService } from '@features/ai-communication/service';
  import { t } from '@ts/i18n';

  export let discussion: DiscussionWithMessages;
  export let onMessageSent: ((message: Message) => void) | null = null;
  export let onMessageReceived: ((message: Message) => void) | null = null;

  let isStreaming = false;
  let currentStreamContent = '';
  let tempAgentMessageId: number | null = null;
  let chatMessages: any[] = [];

  // Convert discussion messages to chat format
  $: chatMessages = discussion.messages.map(msg => ({
    id: msg.id.toString(),
    role: msg.who === 'user' ? 'user' : 'assistant',
    content: msg.content,
    timestamp: new Date(msg.createdAt).toISOString(),
  }));

  onMount(() => {
    // Component initialization if needed
  });

  onDestroy(() => {
    // Cleanup if needed
  });

  async function handleSendMessage(text: string) {
    if (!discussion.agent || isStreaming) return;

    try {
      isStreaming = true;

      // Save user message
      const userMessage = await discussionService.createMessage({
        who: 'user',
        content: text,
        discussionId: discussion.id,
      });

      // Add to store and notify
      discussionStore.addMessage(userMessage);
      if (onMessageSent) {
        onMessageSent(userMessage);
      }

      // Parse agent configuration
      let agentConfig: any = {};
      try {
        agentConfig = JSON.parse(discussion.agent.configuration || '{}');
      } catch (e) {
        console.error('Failed to parse agent configuration:', e);
      }

      // Prepare messages for AI
      let aiMessages: any[] = [];

      // Add system prompt
      if (discussion.agent.systemPrompt) {
        aiMessages.push({
          role: 'system',
          content: discussion.agent.systemPrompt,
        });
      }

      // Add conversation history if agent uses memory
      if (agentConfig.useMemory && discussion.messages.length > 0) {
        const history = discussionService.buildConversationHistory(discussion.messages);
        if (history) {
          aiMessages.push({
            role: 'system',
            content: history,
          });
        }
      }

      // Add new user message
      aiMessages.push({
        role: 'user',
        content: text,
      });

      // Create temporary agent message for streaming
      tempAgentMessageId = -Date.now();
      discussionStore.addTempMessage('agent', '');
      currentStreamContent = '';

      // Stream response
      const stream = aiCommunicationService.streamConversationToAgent(
        discussion.agent.id,
        aiMessages,
        { stream: true }
      );

      for await (const event of stream) {
        if (event.type === 'chunk' && event.data) {
          currentStreamContent += event.data;
          discussionStore.updateMessage(tempAgentMessageId!, currentStreamContent);
        } else if (event.type === 'complete') {
          // Save the complete agent message
          const agentMessage = await discussionService.createMessage({
            who: 'agent',
            content: currentStreamContent,
            discussionId: discussion.id,
          });

          // Replace temp message with real one
          discussionStore.replaceTempMessage(tempAgentMessageId!, agentMessage);
          
          if (onMessageReceived) {
            onMessageReceived(agentMessage);
          }

          tempAgentMessageId = null;
          currentStreamContent = '';
        } else if (event.type === 'error') {
          console.error('Stream error:', event.error);
          // Remove temp message on error
          if (tempAgentMessageId) {
            discussionStore.updateMessage(tempAgentMessageId, 
              `${$t('discussion.chat.error')}: ${event.error?.message || 'Unknown error'}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      isStreaming = false;
    }
  }
</script>

<div class="discussion-chat">
  <ChatThread
    threadId={`discussion-${discussion.id}`}
    customSendHandler={handleSendMessage}
  />
  
  {#if isStreaming}
    <div class="streaming-indicator">
      <span class="spinner"></span>
      {$t('discussion.chat.aiThinking')}
    </div>
  {/if}
</div>