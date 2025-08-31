<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import AgentCard from '@components/discussion/AgentCard.svelte';
  import type { Agent } from '@features/admin/types';
  import { listAgents } from '@features/admin/service';
  import { discussionService } from '@features/discussion/service';
  import { goto } from '@features/router/service';
  import { t } from '@ts/i18n';
  import { setPageTitle, setPageActions, clearPageTitle, clearPageActions } from '@ts/shared/utils/page-utils';
  import { toggleDiscussionSidebar } from '@features/ui/service';

  let agents: Agent[] = [];
  let loading = true;
  let error: string | null = null;
  let selectedAgent: Agent | null = null;
  let creatingDiscussion = false;

  onMount(async () => {
    setPageTitle('discussion.agentSelection.title');
    setPageActions([
      {
        id: 'toggle-discussion-sidebar',
        ariaLabel: $t('discussion.sidebar.toggle'),
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h5v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/></svg>',
        onClick: toggleDiscussionSidebar
      }
    ]);
    await loadAgents();
  });
  
  onDestroy(() => {
    clearPageTitle();
    clearPageActions();
  });

  async function loadAgents() {
    try {
      loading = true;
      error = null;
      agents = await listAgents();
    } catch (err) {
      console.error('Failed to load agents:', err);
      error = err instanceof Error ? err.message : 'Failed to load agents';
    } finally {
      loading = false;
    }
  }

  async function handleAgentSelect(agent: Agent) {
    if (!agent.enable) return;
    
    selectedAgent = agent;
    
    // Navigate to chat view with agent ID (no discussion yet)
    goto('discussion.chat', { agentId: agent.id });
  }
</script>

<div class="view-container agent-selection-view">
  <div class="view-header">
    <p class="view-description">{$t('discussion.agentSelection.description')}</p>
  </div>

  <div class="view-content">
    {#if loading}
      <div class="loading-container">
        <div class="spinner spinner--xl"></div>
        <p>{$t('common.loading')}</p>
      </div>
    {:else if error}
      <div class="error-container">
        <p class="error-message">{error}</p>
        <button class="btn btn-primary" on:click={loadAgents}>
          {$t('common.retry')}
        </button>
      </div>
    {:else if creatingDiscussion}
      <div class="loading-container">
        <div class="spinner spinner--xl"></div>
        <p>{$t('discussion.creatingDiscussion')}</p>
      </div>
    {:else if agents.length === 0}
      <div class="empty-state">
        <p>{$t('discussion.agentSelection.noAgents')}</p>
        <button 
          class="btn btn-primary" 
          on:click={() => goto('admin.entity.agent')}
        >
          {$t('discussion.agentSelection.configureAgents')}
        </button>
      </div>
    {:else}
      <div class="agents-grid">
        {#each agents as agent}
          <AgentCard
            {agent}
            onClick={handleAgentSelect}
            selected={selectedAgent?.id === agent.id}
          />
        {/each}
      </div>
    {/if}
  </div>
</div>