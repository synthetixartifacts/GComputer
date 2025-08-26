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
  import { setPageTitle, setPageActions, clearPageTitle, clearPageActions } from '@ts/shared/utils/page-utils';
  import { toggleDiscussionSidebar } from '@features/ui/service';

  let loading = true;
  let error: string | null = null;
  let discussionId: number | null = null;
  let isNewDiscussion = false;
  let selectedAgent: Agent | null = null;
  let selectedAgentId: number | null = null;
  let refreshKey = 0; // Key to force component remount on refresh

  const unsubscribe = activeDiscussion.subscribe((discussion) => {
    // Update when active discussion changes
    if (discussion && discussion.id === discussionId) {
      loading = false;
    }
  });

  async function handleRouteChange() {
    // Only handle route changes if we're still on the discussion.chat route
    const currentHash = window.location.hash;
    if (!currentHash.startsWith('#/discussion/chat')) {
      // We've navigated away from this view, don't process
      return;
    }
    
    const params = getRouteParams();
    const newDiscussionId = params.discussionId ? parseInt(params.discussionId) : null;
    const newAgentId = params.agentId ? parseInt(params.agentId) : null;
    
    // Check if we need to load different data
    if (newDiscussionId !== discussionId || (newAgentId && newAgentId !== selectedAgentId)) {
      discussionId = newDiscussionId;
      
      if (!discussionId && newAgentId) {
        // New discussion mode with pre-selected agent
        isNewDiscussion = true;
        selectedAgentId = newAgentId;
        discussionStore.clearActiveDiscussion();
        await loadSelectedAgent(newAgentId);
        loading = false;
      } else if (discussionId) {
        // Existing discussion mode
        isNewDiscussion = false;
        selectedAgent = null;
        selectedAgentId = null;
        await loadDiscussion();
      } else {
        // No discussion ID and no agent ID - redirect to agent selection
        goto('discussion.new');
      }
    }
  }
  
  onMount(async () => {
    setPageTitle('discussion.chat.title');
    updatePageActions();
    
    // Initial load
    await handleRouteChange();
    
    // Listen for hash changes to handle navigation from sidebar
    const handleHashChange = () => {
      handleRouteChange();
    };
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  });

  onDestroy(() => {
    unsubscribe();
    discussionStore.clearActiveDiscussion();
    clearPageTitle();
    clearPageActions();
  });
  
  function updatePageActions() {
    const actions = [
      {
        id: 'refresh-discussion',
        ariaLabel: $t('discussion.chat.refresh'),
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>',
        onClick: refreshDiscussion
      },
      {
        id: 'toggle-discussion-sidebar',
        ariaLabel: $t('discussion.sidebar.toggle'),
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h5v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/></svg>',
        onClick: toggleDiscussionSidebar
      }
    ];
    setPageActions(actions);
  }
  
  async function refreshDiscussion() {
    const agentId = selectedAgentId || $activeDiscussion?.agentId;
    if (agentId) {
      // Clear current discussion state
      discussionStore.clearActiveDiscussion();
      discussionId = null;
      isNewDiscussion = true;
      selectedAgentId = agentId;
      refreshKey++; // Increment key to force component remount
      
      // Scroll to top when refreshing
      window.scrollTo(0, 0);
      
      // Load the agent if needed
      if (!selectedAgent || selectedAgent.id !== agentId) {
        await loadSelectedAgent(agentId);
      }
      
      // Update URL to reflect new chat with agent
      history.replaceState(null, '', `#discussion/chat?agentId=${agentId}`);
    }
  }

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
    {#key refreshKey}
      <DiscussionContainer
        discussion={$activeDiscussion}
        agent={selectedAgent}
        onDiscussionCreated={handleDiscussionCreated}
        onTitleChange={handleTitleChange}
        onFavoriteToggle={handleFavoriteToggle}
      />
    {/key}
  {:else}
    <div class="empty-state">
      <p>{$t('discussion.chat.noDiscussion')}</p>
      <button class="btn btn-primary" on:click={() => goto('discussion.list')}>
        {$t('discussion.chat.backToList')}
      </button>
    </div>
  {/if}
</div>