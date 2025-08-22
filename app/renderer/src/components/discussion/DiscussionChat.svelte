<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import ChatThread from '@components/chat/ChatThread.svelte';
  import type { DiscussionWithMessages, Message } from '@features/discussion/types';
  import { discussionStore } from '@features/discussion/store';
  import { DiscussionChatbotBridge } from '@features/discussion/chatbot-bridge';
  import { aiCommunicationService } from '@features/ai-communication/service';
  import { t } from '@ts/i18n';

  export let discussion: DiscussionWithMessages;
  export let onMessageSent: ((message: Message) => void) | null = null;
  export let onMessageReceived: ((message: Message) => void) | null = null;

  let bridge: DiscussionChatbotBridge;
  let threadId: string;
  let useMemory: boolean = false;
  let isValidating: boolean = false;
  let validationResult: boolean | null = null;

  // Create unique thread ID for this discussion
  $: threadId = `discussion-${discussion.id}`;

  // Parse agent configuration to get memory setting
  $: {
    try {
      const agentConfig = JSON.parse(discussion.agent?.configuration || '{}');
      useMemory = agentConfig.useMemory || false;
    } catch (e) {
      useMemory = false;
    }
  }

  onMount(async () => {
    // Create bridge with callbacks
    bridge = new DiscussionChatbotBridge({
      onMessageSaved: (message) => {
        // Update discussion store with new message
        discussionStore.addMessage(message);
        
        // Notify parent component if callback provided
        if (message.who === 'user' && onMessageSent) {
          onMessageSent(message);
        } else if (message.who === 'agent' && onMessageReceived) {
          onMessageReceived(message);
        }
      },
      onError: (error) => {
        console.error('Discussion chat error:', error);
      }
    });

    // Initialize bridge with existing discussion
    await bridge.initialize(discussion, threadId);

    // Validate agent if configured
    if (discussion.agent) {
      isValidating = true;
      try {
        validationResult = await aiCommunicationService.validateAgent(discussion.agent.id);
      } catch (err) {
        validationResult = false;
        console.error('Agent validation failed:', err);
      } finally {
        isValidating = false;
      }
    }
  });

  onDestroy(() => {
    // Cleanup if needed
  });

  // Update bridge when discussion changes
  $: if (bridge && discussion) {
    bridge.updateDiscussion(discussion);
  }

  async function handleSendMessage(text: string): Promise<void> {
    if (!discussion.agent || !bridge) {
      console.error('No agent or bridge configured');
      return;
    }

    if (bridge.getStreamingStatus()) {
      return; // Already streaming
    }

    if (validationResult === false) {
      console.error('Agent validation failed. Please check the API configuration.');
      return;
    }

    // Send message through the bridge
    await bridge.sendMessage(threadId, text, useMemory);
  }
</script>

<div class="discussion-chat h-full">
  <ChatThread
    {threadId}
    customSendHandler={handleSendMessage}
  />
</div>