<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import ChatThread from '@components/chat/ChatThread.svelte';
  import type { DiscussionWithMessages, Message } from '@features/discussion/types';
  import type { Agent } from '@features/admin/types';
  import { discussionStore } from '@features/discussion/store';
  import { DiscussionChatbotBridge } from '@features/discussion/chatbot-bridge';
  import { aiCommunicationService } from '@features/ai-communication/service';
  import { t } from '@ts/i18n';

  export let discussion: DiscussionWithMessages | null = null;
  export let agent: Agent;  // Always required - either from discussion or standalone
  export let onMessageSent: ((message: Message) => void) | null = null;
  export let onMessageReceived: ((message: Message) => void) | null = null;
  export let onDiscussionCreated: ((discussion: DiscussionWithMessages) => void) | null = null;

  let bridge: DiscussionChatbotBridge;
  let threadId: string;
  let useMemory: boolean = false;
  let isValidating: boolean = false;
  let validationResult: boolean | null = null;

  // Create unique thread ID
  $: threadId = discussion ? `discussion-${discussion.id}` : `new-discussion-${agent.id}`;

  // The agent is always provided

  // Parse agent configuration to get memory setting
  $: {
    try {
      const agentConfig = JSON.parse(agent.configuration || '{}');
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
      onDiscussionCreated: (newDiscussion) => {
        discussion = newDiscussion;
        if (onDiscussionCreated) {
          onDiscussionCreated(newDiscussion);
        }
      },
      onError: (error) => {
        console.error('Discussion chat error:', error);
      }
    });

    // Initialize bridge
    await bridge.initialize(discussion, threadId, agent);

    // Validate agent
    isValidating = true;
    try {
      validationResult = await aiCommunicationService.validateAgent(agent.id);
    } catch (err) {
      validationResult = false;
      console.error('Agent validation failed:', err);
    } finally {
      isValidating = false;
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
    if (!agent || !bridge) {
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
    copyKey="discussion.chat.messages.copy"
    copiedKey="discussion.chat.messages.copied"
    placeholderKey="discussion.chat.composer.placeholder"
    inputLabelKey="discussion.chat.composer.inputLabel"
    sendKey="discussion.chat.composer.send"
  />
</div>