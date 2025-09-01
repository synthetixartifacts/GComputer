<script lang="ts">
  import { onMount } from 'svelte';
  import TTSControls from '@components/tts/TTSControls.svelte';
  import TTSPlayer from '@components/tts/TTSPlayer.svelte';
  import { ttsStore, isGenerating, ttsHistory, ttsError, type TTSOptions } from '@features/tts';
  import { t } from '@ts/i18n';

  let text = $state('');
  let options = $state<TTSOptions>({
    voice: 'alloy',
    model: 'tts-1',
    format: 'mp3',
    speed: 1.0
  });
  let currentAudioUrl = $state<string | undefined>();

  async function handleGenerate() {
    if (!text.trim()) return;

    const response = await ttsStore.generate({
      text: text.trim(),
      options
    });

    if (response.audioUrl) {
      currentAudioUrl = response.audioUrl;
    }
  }

  function handleHistorySelect(item: typeof $ttsHistory[0]) {
    currentAudioUrl = item.audioUrl;
    text = item.text;
    options = {
      voice: item.voice,
      model: item.model,
      format: item.format,
      speed: 1.0
    };
  }

  function clearHistory() {
    ttsStore.clearHistory();
  }

  onMount(() => {
    ttsStore.loadHistory();
  });
</script>

<div class="tts-test-view">
  <div class="container">
    <h1>{$t('dev.tts_test')}</h1>
    
    <div class="tts-layout">
      <div class="tts-main">
        <div class="input-section">
          <label for="tts-text">
            {$t('tts.text_input')}
          </label>
          <textarea
            id="tts-text"
            bind:value={text}
            placeholder={$t('tts.text_placeholder')}
            rows="6"
            class="textarea"
            disabled={$isGenerating}
          />
        </div>

        <TTSControls 
          bind:options
          disabled={$isGenerating}
        />

        <div class="generate-section">
          <button
            onclick={handleGenerate}
            disabled={!text.trim() || $isGenerating}
            class="btn btn-primary btn-lg"
          >
            {#if $isGenerating}
              <span class="spinner"></span>
              {$t('tts.generating')}
            {:else}
              {$t('tts.generate')}
            {/if}
          </button>
        </div>

        {#if $ttsError}
          <div class="error-message">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {$ttsError}
          </div>
        {/if}

        {#if currentAudioUrl}
          <div class="player-section">
            <h3>{$t('tts.player')}</h3>
            <TTSPlayer 
              audioUrl={currentAudioUrl}
              showDownload={true}
              showProgress={true}
            />
          </div>
        {/if}
      </div>

      <div class="tts-sidebar">
        <div class="history-section">
          <div class="history-header">
            <h3>{$t('tts.history')}</h3>
            {#if $ttsHistory.length > 0}
              <button 
                onclick={clearHistory}
                class="btn btn-sm btn-secondary"
              >
                {$t('common.clear')}
              </button>
            {/if}
          </div>

          {#if $ttsHistory.length > 0}
            <div class="history-list">
              {#each $ttsHistory as item}
                <button
                  onclick={() => handleHistorySelect(item)}
                  class="history-item"
                >
                  <div class="history-text">
                    {item.text.substring(0, 50)}{item.text.length > 50 ? '...' : ''}
                  </div>
                  <div class="history-meta">
                    <span class="voice">{item.voice}</span>
                    <span class="model">{item.model}</span>
                    <span class="format">{item.format}</span>
                  </div>
                  <div class="history-time">
                    {new Date(item.createdAt).toLocaleTimeString()}
                  </div>
                </button>
              {/each}
            </div>
          {:else}
            <p class="no-history">{$t('tts.no_history')}</p>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>