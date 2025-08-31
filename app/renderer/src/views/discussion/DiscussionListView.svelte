<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import DiscussionList from '@components/discussion/DiscussionList.svelte';
  import type { Discussion } from '@features/discussion/types';
  import { discussionService } from '@features/discussion/service';
  import { discussionStore, discussions } from '@features/discussion/store';
  import { goto } from '@features/router/service';
  import { t } from '@ts/i18n';
  import { setPageTitle, setPageActions, clearPageTitle, clearPageActions } from '@ts/shared/utils/page-utils';
  import { toggleDiscussionSidebar } from '@features/ui/service';

  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    setPageTitle('discussion.listView.title');
    setPageActions([
      {
        id: 'toggle-discussion-sidebar',
        ariaLabel: $t('discussion.sidebar.toggle'),
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h5v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/></svg>',
        onClick: toggleDiscussionSidebar
      }
    ]);
    await loadDiscussions();
  });
  
  onDestroy(() => {
    clearPageTitle();
    clearPageActions();
  });

  async function loadDiscussions() {
    try {
      loading = true;
      error = null;
      const data = await discussionService.listDiscussions();
      discussionStore.setDiscussions(data);
    } catch (err) {
      console.error('Failed to load discussions:', err);
      error = err instanceof Error ? err.message : 'Failed to load discussions';
    } finally {
      loading = false;
    }
  }

  async function handleSelect(discussion: Discussion) {
    goto('discussion.chat', { discussionId: discussion.id });
  }

  async function handleDelete(discussion: Discussion) {
    if (!confirm($t('discussion.confirmDelete', { title: discussion.title }))) {
      return;
    }

    try {
      await discussionService.deleteDiscussion(discussion.id);
      discussionStore.removeDiscussionFromList(discussion.id);
    } catch (err) {
      console.error('Failed to delete discussion:', err);
      alert($t('discussion.deleteError'));
    }
  }

  async function handleToggleFavorite(discussion: Discussion) {
    try {
      const updated = await discussionService.toggleFavorite(discussion.id);
      discussionStore.updateDiscussionInList(updated);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      if (err instanceof Error && err.message.includes('without messages')) {
        alert($t('discussion.favoriteRequiresMessages'));
      } else {
        alert($t('discussion.favoriteError'));
      }
    }
  }
</script>

<div class="view-container discussion-list-view">
  <div class="view-header">
    <div class="header-with-action">
      <p class="view-description">{$t('discussion.listView.description')}</p>
      <button class="btn btn-primary" on:click={() => goto('discussion.new')}>
        {$t('discussion.newDiscussion')}
      </button>
    </div>
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
        <button class="btn btn-primary" on:click={loadDiscussions}>
          {$t('common.retry')}
        </button>
      </div>
    {:else}
      <DiscussionList
        discussions={$discussions || []}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onToggleFavorite={handleToggleFavorite}
      />
    {/if}
  </div>
</div>