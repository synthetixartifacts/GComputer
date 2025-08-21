<script lang="ts">
  import { onMount } from 'svelte';
  import type { DiscussionWithMessages } from '@features/discussion/types';
  import { discussionService } from '@features/discussion/service';
  import { t } from '@ts/i18n';

  export let discussion: DiscussionWithMessages | null = null;
  export let onTitleChange: ((title: string) => void) | null = null;
  export let onFavoriteToggle: (() => void) | null = null;

  let isEditingTitle = false;
  let editedTitle = '';

  $: if (discussion) {
    editedTitle = discussion.title;
  }

  function startEditingTitle() {
    isEditingTitle = true;
    editedTitle = discussion?.title || '';
  }

  async function saveTitle() {
    if (!discussion || editedTitle === discussion.title) {
      isEditingTitle = false;
      return;
    }

    try {
      await discussionService.updateDiscussion({
        id: discussion.id,
        title: editedTitle,
      });

      if (onTitleChange) {
        onTitleChange(editedTitle);
      }

      isEditingTitle = false;
    } catch (error) {
      console.error('Failed to update title:', error);
      editedTitle = discussion.title;
      isEditingTitle = false;
    }
  }

  function cancelEditingTitle() {
    editedTitle = discussion?.title || '';
    isEditingTitle = false;
  }

  async function toggleFavorite() {
    if (!discussion) return;

    if (onFavoriteToggle) {
      onFavoriteToggle();
    } else {
      try {
        await discussionService.toggleFavorite(discussion.id);
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
      }
    }
  }
</script>

{#if discussion}
  <header class="discussion-header">
    <div class="header-content">
      <div class="header-left">
        <button
          class="favorite-btn"
          on:click={toggleFavorite}
          title={discussion.isFavorite ? $t('discussion.header.unfavorite') : $t('discussion.header.favorite')}
        >
          {discussion.isFavorite ? '⭐' : '☆'}
        </button>

        {#if isEditingTitle}
          <div class="title-editor">
            <input
              type="text"
              class="title-input"
              bind:value={editedTitle}
              on:keydown={(e) => {
                if (e.key === 'Enter') saveTitle();
                if (e.key === 'Escape') cancelEditingTitle();
              }}
              autofocus
            />
            <button class="btn btn-sm btn-primary" on:click={saveTitle}>
              {$t('common.save')}
            </button>
            <button class="btn btn-sm btn-secondary" on:click={cancelEditingTitle}>
              {$t('common.cancel')}
            </button>
          </div>
        {:else}
          <h1 class="discussion-title" on:click={startEditingTitle}>
            {discussion.title}
            <span class="edit-icon">✏️</span>
          </h1>
        {/if}
      </div>

      <div class="header-right">
        <div class="agent-info">
          <span class="agent-label">{$t('discussion.header.agent')}:</span>
          <span class="agent-name">{discussion.agent?.name || 'Unknown'}</span>
        </div>
        <div class="message-count">
          <span class="count-label">{$t('discussion.header.messages')}:</span>
          <span class="count-value">{discussion.messages.length}</span>
        </div>
        <div class="updated-time">
          <span class="time-label">{$t('discussion.header.updated')}:</span>
          <span class="time-value">
            {new Date(discussion.updatedAt).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  </header>
{/if}