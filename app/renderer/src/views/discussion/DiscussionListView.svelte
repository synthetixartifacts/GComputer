<script lang="ts">
  import { onMount } from 'svelte';
  import DiscussionList from '@components/discussion/DiscussionList.svelte';
  import type { Discussion } from '@features/discussion/types';
  import { discussionService } from '@features/discussion/service';
  import { discussionStore, discussions } from '@features/discussion/store';
  import { goto } from '@features/router/service';
  import { t } from '@ts/i18n';

  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    await loadDiscussions();
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
    <h1>{$t('discussion.listView.title')}</h1>
    <p class="view-description">{$t('discussion.listView.description')}</p>
  </div>

  <div class="view-content">
    {#if loading}
      <div class="loading-container">
        <div class="spinner"></div>
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
        discussions={$discussions}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onToggleFavorite={handleToggleFavorite}
      />
    {/if}
  </div>
</div>