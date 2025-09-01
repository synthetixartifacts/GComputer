<script lang="ts">
  import { onMount } from 'svelte';
  import VisionUploader from '@components/vision/VisionUploader.svelte';
  import VisionAnalyzer from '@components/vision/VisionAnalyzer.svelte';
  import { visionStore, isAnalyzing, lastAnalysis, visionHistory, visionError, type VisionImage, type VisionOptions, VISION_MODELS, IMAGE_DETAILS } from '@features/vision';
  import { t } from '@ts/i18n';

  let images = $state<VisionImage[]>([]);
  let prompt = $state('');
  let options = $state<VisionOptions>({
    model: 'gpt-4o',
    maxTokens: 500,
    temperature: 0.7,
    detail: 'auto'
  });

  async function handleAnalyze() {
    if (images.length === 0 || !prompt.trim()) return;

    await visionStore.analyze({
      images,
      prompt: prompt.trim(),
      options
    });
  }

  function handleHistorySelect(item: typeof $visionHistory[0]) {
    images = item.images;
    prompt = item.prompt;
    // Set last analysis manually
    lastAnalysis.set({
      analysis: item.analysis,
      model: item.model,
      prompt: item.prompt
    });
  }

  function clearHistory() {
    visionStore.clearHistory();
  }

  function clearAnalysis() {
    visionStore.clearLastAnalysis();
    images = [];
    prompt = '';
  }

  onMount(() => {
    visionStore.loadHistory();
  });
</script>

<div class="vision-test-view">
  <div class="container">
    <h1>{$t('dev.vision_test')}</h1>
    
    <div class="vision-layout">
      <div class="vision-main">
        <div class="upload-section">
          <h3>{$t('vision.upload_images')}</h3>
          <VisionUploader
            bind:images
            maxImages={10}
            allowScreenCapture={true}
          />
        </div>

        {#if images.length > 0}
          <div class="prompt-section">
            <label for="vision-prompt">
              {$t('vision.prompt')}
            </label>
            <textarea
              id="vision-prompt"
              bind:value={prompt}
              placeholder={$t('vision.prompt_placeholder')}
              rows="4"
              class="textarea"
              disabled={$isAnalyzing}
            />
          </div>

          <div class="options-section">
            <h3>{$t('vision.options')}</h3>
            <div class="options-grid">
              <div class="option-group">
                <label for="vision-model">
                  {$t('vision.model')}
                </label>
                <select 
                  id="vision-model"
                  bind:value={options.model}
                  class="select"
                  disabled={$isAnalyzing}
                >
                  {#each Object.entries(VISION_MODELS) as [value, label]}
                    <option {value}>{label}</option>
                  {/each}
                </select>
              </div>

              <div class="option-group">
                <label for="vision-detail">
                  {$t('vision.detail_level')}
                </label>
                <select 
                  id="vision-detail"
                  bind:value={options.detail}
                  class="select"
                  disabled={$isAnalyzing}
                >
                  {#each Object.entries(IMAGE_DETAILS) as [value, label]}
                    <option {value}>{label}</option>
                  {/each}
                </select>
              </div>

              <div class="option-group">
                <label for="vision-max-tokens">
                  {$t('vision.max_tokens')}: {options.maxTokens}
                </label>
                <input
                  id="vision-max-tokens"
                  type="range"
                  min="50"
                  max="2000"
                  step="50"
                  bind:value={options.maxTokens}
                  disabled={$isAnalyzing}
                  class="range"
                />
              </div>

              <div class="option-group">
                <label for="vision-temperature">
                  {$t('vision.temperature')}: {options.temperature}
                </label>
                <input
                  id="vision-temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  bind:value={options.temperature}
                  disabled={$isAnalyzing}
                  class="range"
                />
              </div>
            </div>
          </div>

          <div class="analyze-section">
            <button
              onclick={handleAnalyze}
              disabled={!prompt.trim() || $isAnalyzing}
              class="btn btn-primary btn-lg"
            >
              {#if $isAnalyzing}
                <span class="spinner"></span>
                {$t('vision.analyzing')}
              {:else}
                {$t('vision.analyze')}
              {/if}
            </button>
          </div>
        {/if}

        {#if $visionError}
          <div class="error-message">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {$visionError}
          </div>
        {/if}

        {#if $lastAnalysis}
          <div class="analysis-section">
            <div class="analysis-header">
              <h3>{$t('vision.analysis_result')}</h3>
              <button 
                onclick={clearAnalysis}
                class="btn btn-secondary"
              >
                {$t('common.clear')}
              </button>
            </div>
            <VisionAnalyzer
              analysis={$lastAnalysis.analysis}
              showDetails={true}
              loading={$isAnalyzing}
            />
          </div>
        {/if}
      </div>

      <div class="vision-sidebar">
        <div class="history-section">
          <div class="history-header">
            <h3>{$t('vision.history')}</h3>
            {#if $visionHistory.length > 0}
              <button 
                onclick={clearHistory}
                class="btn btn-sm btn-secondary"
              >
                {$t('common.clear')}
              </button>
            {/if}
          </div>

          {#if $visionHistory.length > 0}
            <div class="history-list">
              {#each $visionHistory as item}
                <button
                  onclick={() => handleHistorySelect(item)}
                  class="history-item"
                >
                  <div class="history-preview">
                    <span class="image-count">{item.images.length} {$t('vision.images')}</span>
                  </div>
                  <div class="history-prompt">
                    {item.prompt.substring(0, 50)}{item.prompt.length > 50 ? '...' : ''}
                  </div>
                  <div class="history-meta">
                    <span class="model">{item.model}</span>
                  </div>
                  <div class="history-time">
                    {new Date(item.createdAt).toLocaleTimeString()}
                  </div>
                </button>
              {/each}
            </div>
          {:else}
            <p class="no-history">{$t('vision.no_history')}</p>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>