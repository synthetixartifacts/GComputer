<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import DiscussionHeader from '@components/discussion/DiscussionHeader.svelte';
  import DiscussionChat from '@components/discussion/DiscussionChat.svelte';
  import type { DiscussionWithMessages } from '@features/discussion/types';
  import { discussionService } from '@features/discussion/service';
  import { discussionStore, activeDiscussion } from '@features/discussion/store';
  import { getRouteParams } from '@features/router/service';
  import { goto } from '@features/router/service';
  import { t } from '@ts/i18n';

  let loading = true;
  let error: string | null = null;
  let discussionId: number | null = null;

  const unsubscribe = activeDiscussion.subscribe((discussion) => {
    // Update when active discussion changes
    if (discussion && discussion.id === discussionId) {
      loading = false;
    }
  });

  onMount(async () => {
    const params = getRouteParams();
    discussionId = params.discussionId ? parseInt(params.discussionId) : null;

    if (!discussionId) {
      error = $t('discussion.chat.noDiscussionId');
      loading = false;
      return;
    }

    await loadDiscussion();
  });

  onDestroy(() => {
    unsubscribe();
    discussionStore.clearActiveDiscussion();
  });

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

  function handleMessageSent() {
    // Update discussion timestamp
    if ($activeDiscussion) {
      discussionStore.setActiveDiscussion({
        ...$activeDiscussion,
        updatedAt: new Date(),
      });
    }
  }

  function handleMessageReceived() {
    // Update discussion timestamp
    if ($activeDiscussion) {
      discussionStore.setActiveDiscussion({
        ...$activeDiscussion,
        updatedAt: new Date(),
      });
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
  {:else if $activeDiscussion}
    <div class="chat-container">
      <DiscussionHeader
        discussion={$activeDiscussion}
        onTitleChange={handleTitleChange}
        onFavoriteToggle={handleFavoriteToggle}
      />
      
      <div class="chat-content">
        <DiscussionChat
          discussion={$activeDiscussion}
          onMessageSent={handleMessageSent}
          onMessageReceived={handleMessageReceived}
        />
      </div>
    </div>
  {:else}
    <div class="empty-state">
      <p>{$t('discussion.chat.noDiscussion')}</p>
      <button class="btn btn-primary" on:click={() => goto('discussion.list')}>
        {$t('discussion.chat.backToList')}
      </button>
    </div>
  {/if}
</div>