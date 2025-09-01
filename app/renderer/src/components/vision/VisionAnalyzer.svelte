<script lang="ts">
  import type { VisionAnalysis } from '@features/vision';
  import { t } from '@ts/i18n';

  interface Props {
    analysis?: VisionAnalysis;
    showDetails?: boolean;
    loading?: boolean;
  }

  let {
    analysis,
    showDetails = true,
    loading = false
  }: Props = $props();

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }
</script>

<div class="vision-analyzer">
  {#if loading}
    <div class="analyzing">
      <div class="spinner"></div>
      <span>{$t('vision.analyzing')}</span>
    </div>
  {:else if analysis}
    <div class="analysis-content">
      <div class="description-section">
        <h4>{$t('vision.description')}</h4>
        <p class="description-text">{analysis.description}</p>
        <button 
          onclick={() => copyToClipboard(analysis.description)}
          class="btn btn-secondary copy-button"
        >
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          {$t('common.copy')}
        </button>
      </div>

      {#if showDetails}
        {#if analysis.objects && analysis.objects.length > 0}
          <div class="detail-section">
            <h5>{$t('vision.objects_detected')}</h5>
            <div class="tag-list">
              {#each analysis.objects as object}
                <span class="tag">{object}</span>
              {/each}
            </div>
          </div>
        {/if}

        {#if analysis.text && analysis.text.length > 0}
          <div class="detail-section">
            <h5>{$t('vision.text_found')}</h5>
            <div class="text-list">
              {#each analysis.text as text}
                <div class="text-item">
                  <span>{text}</span>
                  <button 
                    onclick={() => copyToClipboard(text)}
                    class="btn btn-icon"
                    aria-label={$t('common.copy')}
                  >
                    <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if analysis.colors && analysis.colors.length > 0}
          <div class="detail-section">
            <h5>{$t('vision.colors')}</h5>
            <div class="color-list">
              {#each analysis.colors as color}
                <div class="color-item">
                  <span 
                    class="color-swatch" 
                    style="background-color: {color}"
                    aria-label={color}
                  ></span>
                  <span>{color}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if analysis.confidence}
          <div class="detail-section">
            <h5>{$t('vision.confidence')}</h5>
            <div class="confidence-bar">
              <div 
                class="confidence-fill"
                style="width: {analysis.confidence * 100}%"
              ></div>
              <span class="confidence-value">
                {Math.round(analysis.confidence * 100)}%
              </span>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  {:else}
    <div class="no-analysis">
      <p>{$t('vision.no_analysis')}</p>
    </div>
  {/if}
</div>