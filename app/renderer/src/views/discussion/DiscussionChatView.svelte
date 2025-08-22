<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import DiscussionContainer from '@components/discussion/DiscussionContainer.svelte';
  import type { DiscussionWithMessages } from '@features/discussion/types';
  import type { Agent } from '@features/admin/types';
  import { discussionService } from '@features/discussion/service';
  import { listAgents } from '@features/admin/service';
  import { discussionStore, activeDiscussion, discussions } from '@features/discussion/store';
  import { getRouteParams, goto } from '@features/router/service';
  import { t } from '@ts/i18n';

  let loading = true;
  let error: string | null = null;
  let discussionId: number | null = null;
  let isNewDiscussion = false;
  let selectedAgent: Agent | null = null;
  let selectedAgentId: number | null = null;

  const unsubscribe = activeDiscussion.subscribe((discussion) => {
    // Update when active discussion changes
    if (discussion && discussion.id === discussionId) {
      loading = false;
    }
  });

  onMount(async () => {
    const params = getRouteParams();
    discussionId = params.discussionId ? parseInt(params.discussionId) : null;
    const agentIdParam = params.agentId ? parseInt(params.agentId) : null;
    
    if (!discussionId && agentIdParam) {
      // New discussion mode with pre-selected agent
      isNewDiscussion = true;
      selectedAgentId = agentIdParam;
      await loadSelectedAgent(agentIdParam);
      loading = false;
    } else if (discussionId) {
      // Existing discussion mode
      await loadDiscussion();
    } else {
      // No discussion ID and no agent ID - redirect to agent selection
      goto('discussion.new');
    }
  });

  onDestroy(() => {
    unsubscribe();
    discussionStore.clearActiveDiscussion();
  });

  async function loadSelectedAgent(agentId: number) {
    try {
      // Load the full agent with its relationships (model, provider)
      const agents = await listAgents();
      selectedAgent = agents.find(a => a.id === agentId) || null;
      
      if (!selectedAgent) {
        console.error('Selected agent not found:', agentId);
        error = 'Selected agent not found';
        // Redirect to agent selection
        goto('discussion.new');
      }
    } catch (err) {
      console.error('Failed to load agent:', err);
      error = 'Failed to load agent';
    }
  }

  async function loadDiscussion() {
    if (!discussionId) return;

    try {
      loading = true;
      error = null;

      const discussion = await discussionService.getDiscussionWithMessages(discussionId);
      
      if (!discussion) {
        error = $t('discussion.chat.notFound');
        loading = false;
        return;
      }

      discussionStore.setActiveDiscussion(discussion);
    } catch (err) {
      console.error('Failed to load discussion:', err);
      error = err instanceof Error ? err.message : 'Failed to load discussion';
    } finally {
      loading = false;
    }
  }

  function handleDiscussionCreated(discussion: DiscussionWithMessages) {
    // Update URL to reflect the new discussion ID
    discussionId = discussion.id;
    isNewDiscussion = false;
    discussionStore.setActiveDiscussion(discussion);
    
    // Add to discussions list
    const currentDiscussions = $discussions || [];
    discussionStore.setDiscussions([...currentDiscussions, discussion]);
    
    // Update the URL by navigating to the discussion
    history.replaceState(null, '', `#discussion/chat?discussionId=${discussion.id}`);
  }

  async function handleTitleChange(newTitle: string) {
    if (!$activeDiscussion) return;

    // Update in store
    discussionStore.setActiveDiscussion({
      ...$activeDiscussion,
      title: newTitle,
    });
  }

  async function handleFavoriteToggle() {
    if (!$activeDiscussion) return;

    try {
      const updated = await discussionService.toggleFavorite($activeDiscussion.id);
      discussionStore.setActiveDiscussion({
        ...$activeDiscussion,
        isFavorite: updated.isFavorite,
      });
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      if (err instanceof Error && err.message.includes('without messages')) {
        alert($t('discussion.favoriteRequiresMessages'));
      }
    }
  }

</script>

<div class="view-container discussion-chat-view">
  {#if loading}
    <div class="loading-container">
      <div class="spinner"></div>
      <p>{$t('discussion.chat.loading')}</p>
    </div>
  {:else if error}
    <div class="error-container">
      <h2>{$t('common.error')}</h2>
      <p class="error-message">{error}</p>
      <div class="error-actions">
        <button class="btn btn-primary" on:click={loadDiscussion}>
          {$t('common.retry')}
        </button>
        <button class="btn btn-secondary" on:click={() => goto('discussion.list')}>
          {$t('discussion.chat.backToList')}
        </button>
      </div>
    </div>
  {:else if $activeDiscussion || (isNewDiscussion && selectedAgent)}
    <DiscussionContainer
      discussion={$activeDiscussion}
      agent={selectedAgent}
      onDiscussionCreated={handleDiscussionCreated}
      onTitleChange={handleTitleChange}
      onFavoriteToggle={handleFavoriteToggle}
    />
  {:else}
    <div class="empty-state">
      <p>{$t('discussion.chat.noDiscussion')}</p>
      <button class="btn btn-primary" on:click={() => goto('discussion.list')}>
        {$t('discussion.chat.backToList')}
      </button>
    </div>
  {/if}
</div>