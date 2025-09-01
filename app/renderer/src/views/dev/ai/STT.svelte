<script lang="ts">
  import { onMount } from 'svelte';
  import STTRecorder from '@components/stt/STTRecorder.svelte';
  import STTTranscript from '@components/stt/STTTranscript.svelte';
  import { sttStore, isTranscribing, lastTranscription, sttHistory, sttError, type STTOptions, STT_MODELS, STT_LANGUAGES } from '@features/stt';
  import { t } from '@ts/i18n';

  let selectedFile: File | undefined = $state();
  let options = $state<STTOptions>({
    model: 'whisper-1',
    language: 'auto',
    format: 'json'
  });

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      selectedFile = target.files[0];
    }
  }

  async function transcribeFile() {
    if (!selectedFile) return;

    await sttStore.transcribeFromFile(selectedFile, options);
  }

  function handleTranscription(text: string) {
    // Transcription is automatically added to store
    console.log('New transcription:', text);
  }

  function handleHistorySelect(item: typeof $sttHistory[0]) {
    // Create a mock transcription response from history
    sttStore.clearLastTranscription();
    const mockResponse = {
      text: item.text,
      language: item.language,
      duration: item.duration,
      model: item.model
    };
    // Manually set last transcription
    lastTranscription.set(mockResponse);
  }

  function clearHistory() {
    sttStore.clearHistory();
  }

  onMount(() => {
    sttStore.loadHistory();
  });
</script>

<div class="stt-test-view">
  <div class="container">
    <h1>{$t('dev.stt_test')}</h1>
    
    <div class="stt-layout">
      <div class="stt-main">
        <div class="options-section">
          <h3>{$t('stt.options')}</h3>
          <div class="option-group">
            <label for="stt-model">
              {$t('stt.model')}
            </label>
            <select 
              id="stt-model"
              bind:value={options.model}
              class="select"
            >
              {#each Object.entries(STT_MODELS) as [value, label]}
                <option {value}>{label}</option>
              {/each}
            </select>
          </div>

          <div class="option-group">
            <label for="stt-language">
              {$t('stt.language')}
            </label>
            <select 
              id="stt-language"
              bind:value={options.language}
              class="select"
            >
              {#each Object.entries(STT_LANGUAGES) as [value, label]}
                <option {value}>{label}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="input-methods">
          <div class="method-section">
            <h3>{$t('stt.record_audio')}</h3>
            <STTRecorder
              {options}
              onTranscription={handleTranscription}
              autoTranscribe={true}
              maxDuration={300}
            />
          </div>

          <div class="method-section">
            <h3>{$t('stt.upload_file')}</h3>
            <div class="file-upload">
              <input
                type="file"
                accept="audio/*,.mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm"
                onchange={handleFileSelect}
                class="file-input"
                disabled={$isTranscribing}
              />
              {#if selectedFile}
                <div class="selected-file">
                  <span>{selectedFile.name}</span>
                  <span class="file-size">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  onclick={transcribeFile}
                  disabled={$isTranscribing}
                  class="btn btn-primary"
                >
                  {#if $isTranscribing}
                    <span class="spinner"></span>
                    {$t('stt.transcribing')}
                  {:else}
                    {$t('stt.transcribe')}
                  {/if}
                </button>
              {/if}
            </div>
          </div>
        </div>

        {#if $sttError}
          <div class="error-message">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {$sttError}
          </div>
        {/if}

        {#if $lastTranscription}
          <div class="transcript-section">
            <h3>{$t('stt.transcript')}</h3>
            <STTTranscript
              transcription={$lastTranscription}
              showSegments={false}
              showMetadata={true}
              editable={true}
            />
          </div>
        {/if}
      </div>

      <div class="stt-sidebar">
        <div class="history-section">
          <div class="history-header">
            <h3>{$t('stt.history')}</h3>
            {#if $sttHistory.length > 0}
              <button 
                onclick={clearHistory}
                class="btn btn-sm btn-secondary"
              >
                {$t('common.clear')}
              </button>
            {/if}
          </div>

          {#if $sttHistory.length > 0}
            <div class="history-list">
              {#each $sttHistory as item}
                <button
                  onclick={() => handleHistorySelect(item)}
                  class="history-item"
                >
                  <div class="history-text">
                    {item.text.substring(0, 100)}{item.text.length > 100 ? '...' : ''}
                  </div>
                  <div class="history-meta">
                    <span class="language">{item.language}</span>
                    <span class="model">{item.model}</span>
                    <span class="duration">{Math.round(item.duration)}s</span>
                  </div>
                  <div class="history-time">
                    {new Date(item.createdAt).toLocaleTimeString()}
                  </div>
                </button>
              {/each}
            </div>
          {:else}
            <p class="no-history">{$t('stt.no_history')}</p>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>