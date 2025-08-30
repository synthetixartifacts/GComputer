<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { agents } from '@features/admin/store';
  import { listProviders, listModels, listAgents } from '@features/admin/service';
  import { aiCommunicationService } from '@features/ai-communication/service';
  import { AIChatbotBridge } from '@features/ai-communication/chatbot-bridge';
  import { chatbotStore } from '@features/chatbot/store';
  import { sendMessage } from '@features/chatbot/service';
  import ChatThread from '@components/chat/ChatThread.svelte';
  import type { Agent } from '@features/admin/types';
  import { t as tStore } from '@ts/i18n/store';

  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));

  let selectedAgentId: number | null = null;
  let streamingMode = true;
  let validationResult: boolean | null = null;
  let agentsList: Agent[] = [];
  let currentAgent: Agent | null = null;
  let isValidating = false;
  let isStreaming = false;
  let tokenUsage = { input: 0, output: 0, total: 0 };

  const threadId = 'ai-communication-test';
  const bridge = new AIChatbotBridge();

  const unsubAgents = agents.subscribe(($agents) => {
    agentsList = $agents || [];
  });

  onMount(async () => {
    // Set up chat thread
    chatbotStore.setActiveThread(threadId);
    chatbotStore.replaceThreadMessages(threadId, [
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Welcome to AI Communication testing! Please select an agent from the sidebar to start chatting.',
        createdAtIso: new Date().toISOString()
      }
    ]);

    // Load data and populate stores
    const [providersList, modelsList, agentsList] = await Promise.all([
      listProviders(),
      listModels(), 
      listAgents()
    ]);
    
    // Update the agents store so our subscription gets the data
    agents.set(agentsList);
  });

  onDestroy(() => {
    unsubAgents();
    unsubT();
  });

  async function selectAgent(agentId: number) {
    selectedAgentId = agentId;
    currentAgent = agentsList.find(a => a.id === agentId) || null;
    
    // Configure the bridge with the selected agent
    bridge.setActiveAgent(agentId);
    
    // Clear previous validation
    validationResult = null;
    isValidating = true;
    
    // Add agent selection message to chat
    if (currentAgent) {
      chatbotStore.addAssistantMessage(threadId, 
        `🤖 Agent "${currentAgent.name}" selected. Using model: ${currentAgent.model?.name || 'Unknown'} via ${currentAgent.model?.provider?.name || 'Unknown'}. You can now start chatting!`
      );
    }

    try {
      validationResult = await aiCommunicationService.validateAgent(agentId);
      if (!validationResult) {
        chatbotStore.addAssistantMessage(threadId, 
          '⚠️ Agent validation failed. Please check that the provider has a valid API key configured in the admin panel.'
        );
      }
    } catch (err) {
      validationResult = false;
      chatbotStore.addAssistantMessage(threadId, 
        `❌ Validation error: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      isValidating = false;
    }
  }

  // Custom send function that uses our AI bridge
  async function handleSend(text: string): Promise<void> {
    if (!selectedAgentId) {
      chatbotStore.addAssistantMessage(threadId, '⚠️ Please select an agent first.');
      return;
    }

    if (!validationResult) {
      chatbotStore.addAssistantMessage(threadId, '⚠️ Agent validation failed. Please check the API configuration.');
      return;
    }

    try {
      isStreaming = true;
      // Use the bridge to send the message with real AI
      await bridge.sendMessage(threadId, text, streamingMode);
      
      // Update token usage display
      tokenUsage = bridge.getTokenUsage();
    } finally {
      isStreaming = false;
    }
  }

  function clearChat() {
    chatbotStore.replaceThreadMessages(threadId, []);
    bridge.resetTokenUsage();
    tokenUsage = { input: 0, output: 0, total: 0 };
    
    if (currentAgent) {
      chatbotStore.addAssistantMessage(threadId, 
        `🤖 Chat cleared. Agent "${currentAgent.name}" is ready for new conversation.`
      );
    }
  }
</script>

<div class="ai-communication-test h-full flex">
  <!-- Sidebar for Agent Selection -->
  <div class="w-80 border-r bg-gray-50 p-4 space-y-4">
    <div>
      <h2 class="text-lg font-semibold mb-2">AI Communication Test</h2>
      <p class="text-sm text-gray-600 mb-4">Select an agent and start chatting with real AI</p>
      
      <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
        <p class="text-sm text-blue-800">
          <strong>Note:</strong> Configure API keys in Development → Admin → Entity → LLM → Provider
        </p>
      </div>
    </div>

    <div class="space-y-3">
      <h3 class="font-medium">Select Agent</h3>
      
      {#if agentsList.length === 0}
        <div class="p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p class="text-sm text-yellow-800">No agents available. Create agents in the admin panel first.</p>
        </div>
      {:else}
        <div class="space-y-2">
          {#each agentsList as agent}
            <button
              class="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors text-sm"
              class:bg-blue-50={selectedAgentId === agent.id}
              class:border-blue-300={selectedAgentId === agent.id}
              on:click={() => selectAgent(agent.id)}
            >
              <div class="font-medium">{agent.name}</div>
              <div class="text-xs text-gray-600">
                {agent.model?.name || 'No model'} • {agent.model?.provider?.name || 'No provider'}
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    {#if currentAgent}
      <div class="border-t pt-3 space-y-3">
        <h3 class="font-medium">Configuration</h3>
        
        <div class="p-3 bg-gray-100 rounded text-xs space-y-2">
          <div><strong>Agent:</strong> {currentAgent.name}</div>
          <div><strong>Model:</strong> {currentAgent.model?.name || 'None'}</div>
          <div><strong>Provider:</strong> {currentAgent.model?.provider?.name || 'None'}</div>
          
          {#if validationResult !== null}
            <div class="flex items-center gap-2">
              <strong>Status:</strong>
              <span class="px-2 py-1 rounded text-xs" 
                    class:bg-green-100={validationResult} 
                    class:text-green-800={validationResult}
                    class:bg-red-100={!validationResult} 
                    class:text-red-800={!validationResult}>
                {isValidating ? 'Validating...' : validationResult ? 'Valid' : 'Invalid'}
              </span>
            </div>
          {/if}
        </div>

        <div class="space-y-2">
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" bind:checked={streamingMode} />
            <span>Streaming Mode</span>
          </label>
          
          <button
            on:click={clearChat}
            class="w-full px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            Clear Chat
          </button>
          
          <!-- Token Usage Display -->
          {#if tokenUsage.total > 0}
            <div class="border-t pt-2 mt-2">
              <h4 class="font-medium text-xs mb-2">Token Usage</h4>
              <div class="grid grid-cols-3 gap-1 text-xs">
                <div class="p-2 bg-blue-50 rounded text-center">
                  <div class="font-medium">Input</div>
                  <div class="text-blue-600">{tokenUsage.input}</div>
                </div>
                <div class="p-2 bg-green-50 rounded text-center">
                  <div class="font-medium">Output</div>
                  <div class="text-green-600">{tokenUsage.output}</div>
                </div>
                <div class="p-2 bg-purple-50 rounded text-center">
                  <div class="font-medium">Total</div>
                  <div class="text-purple-600">{tokenUsage.total}</div>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Main Chat Area -->
  <div class="flex-1 flex flex-col">
    <div class="p-4 border-b bg-white">
      <h1 class="text-xl font-bold">
        {currentAgent ? `Chat with ${currentAgent.name}` : 'AI Communication Test'}
      </h1>
      {#if currentAgent}
        <p class="text-sm text-gray-600">
          Using {currentAgent.model?.name} via {currentAgent.model?.provider?.name}
          {#if streamingMode}(Streaming){/if}
        </p>
      {/if}
    </div>
    
    <div class="flex-1 min-h-0 p-4">
      <div class="h-full border rounded-lg bg-white">
        <div class="h-full p-3">
          <ChatThread 
            {threadId} 
            customSendHandler={handleSend}
            {isStreaming}
            copyKey="pages.development.ai.messages.copy"
            copiedKey="pages.development.ai.messages.copied"
            placeholderKey="pages.development.ai.composer.placeholder"
            inputLabelKey="pages.development.ai.composer.inputLabel"
            sendKey="pages.development.ai.composer.send"
          />
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .ai-communication-test {
    height: calc(100vh - 8rem); /* Adjust based on your layout */
  }
</style>