<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '@features/router/service';
  import { lockBodyScroll, unlockBodyScroll } from '@renderer/ts/shared/utils/scroll-lock';
  import { listAgents } from '@features/admin/service';
  import { discussionService } from '@features/discussion/service';
  import { discussions, discussionStore } from '@features/discussion/store';
  import type { Agent } from '@features/admin/types';
  import type { Discussion } from '@features/discussion/types';
  import { t as tStore } from '@ts/i18n/store';
  
  export let open = false;
  export let onClose: () => void;
  
  let t: (key: string, params?: Record<string, string | number>) => string = (k: string) => k;
  let agents: Agent[] = [];
  let recentDiscussions: Discussion[] = [];
  let loading = true;
  
  const unsubT = tStore.subscribe((fn) => (t = fn));
  const unsubDiscussions = discussions.subscribe((d) => {
    if (d) {
      recentDiscussions = d.slice(0, 20);
    }
  });
  
  onMount(async () => {
    await loadData();
  });
  
  onDestroy(() => {
    unsubT();
    unsubDiscussions();
  });
  
  async function loadData() {
    try {
      loading = true;
      
      // Load agents
      const loadedAgents = await listAgents();
      agents = loadedAgents;
      
      // Load discussions if not already in store
      // Use recentDiscussions which is already subscribed to discussions store
      if (!recentDiscussions || recentDiscussions.length === 0) {
        const loadedDiscussions = await discussionService.listDiscussions();
        discussionStore.setDiscussions(loadedDiscussions);
      }
    } catch (err) {
      console.error('Failed to load sidebar data:', err);
      // TODO: Add user-facing error notification
    } finally {
      loading = false;
    }
  }
  
  function selectAgent(agentId: number) {
    goto('discussion.chat', { agentId: agentId.toString() });
    onClose();
  }
  
  function selectDiscussion(discussionId: number) {
    goto('discussion.chat', { discussionId: discussionId.toString() });
    onClose();
  }
  
  function goToDiscussionList() {
    goto('discussion.list');
    onClose();
  }
  
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    }
  }

  // Handle scroll lock when sidebar opens/closes
  $: if (open) {
    lockBodyScroll();
  } else {
    unlockBodyScroll();
  }

  onDestroy(() => {
    // Ensure we release the lock if unmounting while open
    if (open) {
      unlockBodyScroll();
    }
  });
</script>

{#if open}
  <div 
    class="discussion-sidebar-backdrop"
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="presentation"
    aria-hidden="true"
  >
    <aside class="discussion-sidebar" role="complementary">
      <div class="discussion-sidebar__header">
        <h2>{t('discussion.sidebar.title')}</h2>
        <button 
          class="btn btn--secondary gc-icon-btn"
          on:click={onClose}
          aria-label={t('discussion.sidebar.close')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      
      <div class="discussion-sidebar__content">
        {#if loading}
          <div class="loading-container">
            <div class="spinner spinner--accent"></div>
            <p>{t('common.loading')}</p>
          </div>
        {:else}
          <section class="discussion-sidebar__section">
            <h3>{t('discussion.sidebar.agents')}</h3>
            <div class="agent-list">
              {#each agents as agent}
                <button
                  class="agent-item"
                  on:click={() => selectAgent(agent.id)}
                >
                  <span class="agent-name">{agent.name}</span>
                  <span class="agent-code">{agent.code}</span>
                </button>
              {/each}
            </div>
          </section>
          
          <section class="discussion-sidebar__section">
            <h3>{t('discussion.sidebar.recentDiscussions')}</h3>
            <div class="discussion-list">
              {#each recentDiscussions as discussion}
                <button
                  class="discussion-item"
                  on:click={() => selectDiscussion(discussion.id)}
                >
                  <span class="discussion-title">{discussion.title}</span>
                  {#if discussion.isFavorite}
                    <span class="favorite-indicator">⭐</span>
                  {/if}
                </button>
              {/each}
            </div>
            <button
              class="btn btn--primary see-all-btn"
              on:click={() => goToDiscussionList()}
              type="button"
            >
              {t('discussion.sidebar.seeAll')}
            </button>
          </section>
        {/if}
      </div>
    </aside>
  </div>
{/if}
