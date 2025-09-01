<script lang="ts">
  import { onMount } from 'svelte';
  import type { STTResponse, STTSegment } from '@features/stt';
  import { t } from '@ts/i18n';

  interface Props {
    transcription?: STTResponse;
    showSegments?: boolean;
    showMetadata?: boolean;
    editable?: boolean;
    onEdit?: (text: string) => void;
  }

  let {
    transcription,
    showSegments = false,
    showMetadata = true,
    editable = false,
    onEdit
  }: Props = $props();

  let editedText = $state(transcription?.text || '');
  let isEditing = $state(false);

  $effect(() => {
    editedText = transcription?.text || '';
  });

  function startEdit() {
    isEditing = true;
    editedText = transcription?.text || '';
  }

  function saveEdit() {
    isEditing = false;
    onEdit?.(editedText);
  }

  function cancelEdit() {
    isEditing = false;
    editedText = transcription?.text || '';
  }

  function copyToClipboard() {
    if (transcription?.text) {
      navigator.clipboard.writeText(transcription.text);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }
</script>

<div class="stt-transcript">
  {#if transcription}
    {#if showMetadata}
      <div class="transcript-metadata">
        <span class="model">{$t('stt.model')}: {transcription.model}</span>
        {#if transcription.language}
          <span class="language">{$t('stt.language')}: {transcription.language}</span>
        {/if}
        {#if transcription.duration}
          <span class="duration">{$t('stt.duration')}: {formatTime(transcription.duration)}</span>
        {/if}
      </div>
    {/if}

    <div class="transcript-content">
      {#if isEditing}
        <textarea
          bind:value={editedText}
          class="transcript-editor"
          rows="10"
        />
        <div class="edit-actions">
          <button onclick={saveEdit} class="btn btn-primary">
            {$t('common.save')}
          </button>
          <button onclick={cancelEdit} class="btn btn-secondary">
            {$t('common.cancel')}
          </button>
        </div>
      {:else}
        <div class="transcript-text">
          {transcription.text}
        </div>
        <div class="transcript-actions">
          <button onclick={copyToClipboard} class="btn btn-secondary">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            {$t('common.copy')}
          </button>
          {#if editable}
            <button onclick={startEdit} class="btn btn-secondary">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              {$t('common.edit')}
            </button>
          {/if}
        </div>
      {/if}
    </div>

    {#if showSegments && transcription.segments}
      <div class="transcript-segments">
        <h4>{$t('stt.segments')}</h4>
        {#each transcription.segments as segment}
          <div class="segment">
            <span class="segment-time">
              [{formatTime(segment.start)} - {formatTime(segment.end)}]
            </span>
            <span class="segment-text">{segment.text}</span>
          </div>
        {/each}
      </div>
    {/if}
  {:else}
    <div class="no-transcript">
      <p>{$t('stt.no_transcript')}</p>
    </div>
  {/if}
</div>