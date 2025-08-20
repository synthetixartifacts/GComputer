<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Modal from '@components/Modal.svelte';
  import { t as tStore } from '@ts/i18n/store';
  import { getAvailableDisplays, captureDisplay, captureAllDisplays } from '@features/computer-capture/service';
  import type { DisplayInfo } from '@features/computer-capture/types';
  
  export let open: boolean = false;
  export let onClose: () => void;
  export let savePath: string | undefined = undefined;
  
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  
  let displays: DisplayInfo[] = [];
  let selectedDisplay: string | 'all' = 'all';
  let isCapturing = false;
  let isLoading = true;
  let screenSources: any[] = [];
  let videoElements: Map<string, HTMLVideoElement> = new Map();
  
  async function loadDisplays() {
    isLoading = true;
    try {
      // Get display information
      displays = await getAvailableDisplays();
      
      // Get screen sources for previews
      if (window.gc?.screen?.getSources) {
        screenSources = await window.gc.screen.getSources();
      }
      
      if (displays.length === 1) {
        // If only one display, select it by default
        selectedDisplay = displays[0].id;
      }
      
      // Start video previews after a short delay
      setTimeout(() => startVideoPreviews(), 100);
    } catch (error) {
      console.error('Failed to load displays:', error);
    } finally {
      isLoading = false;
    }
  }
  
  async function startVideoPreviews() {
    if (!screenSources || screenSources.length === 0) {
      console.warn('No screen sources available for preview');
      return;
    }
    
    // Start a video stream for each display
    for (const source of screenSources) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: source.id
            }
          } as any
        });
        
        // Set the stream to the video element if it exists
        const displayId = source.display_id || source.displayInfo?.id || source.id;
        const videoEl = videoElements.get(displayId);
        if (videoEl) {
          videoEl.srcObject = stream;
          await videoEl.play().catch(e => console.warn('Video play failed:', e));
        } else {
          // Clean up stream if no video element found
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (error) {
        console.warn(`Failed to start preview for source ${source.id}:`, error);
        // Continue with other sources even if one fails
      }
    }
  }
  
  function stopVideoPreviews() {
    // Stop all video streams
    videoElements.forEach((videoEl) => {
      if (videoEl.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoEl.srcObject = null;
      }
    });
  }
  
  async function handleCapture() {
    if (isCapturing) return;
    
    isCapturing = true;
    try {
      // Stop video previews before capturing to free resources
      stopVideoPreviews();
      
      if (selectedDisplay === 'all') {
        await captureAllDisplays(savePath);
      } else {
        await captureDisplay(selectedDisplay, savePath);
      }
      
      // Close modal on success
      onClose();
    } catch (error) {
      console.error('Capture failed:', error);
      // Show error to user (you could add a toast notification here)
      alert(`Capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Restart previews if capture failed and modal stays open
      setTimeout(() => startVideoPreviews(), 100);
    } finally {
      isCapturing = false;
    }
  }
  
  // Load displays when modal opens
  $: if (open) {
    loadDisplays();
  } else {
    // Stop previews when modal closes
    stopVideoPreviews();
  }
  
  function registerVideoElement(displayId: string) {
    return (node: HTMLVideoElement) => {
      if (node) {
        videoElements.set(displayId, node);
        // Try to start preview for this element if sources are ready
        const source = screenSources.find(s => 
          s.display_id === displayId || 
          s.displayInfo?.id === displayId ||
          s.id === displayId
        );
        if (source) {
          startVideoForElement(displayId, source);
        }
      }
    };
  }
  
  async function startVideoForElement(displayId: string, source: any) {
    const videoEl = videoElements.get(displayId);
    if (!videoEl || videoEl.srcObject) return; // Already playing
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id
          }
        } as any
      });
      
      videoEl.srcObject = stream;
      await videoEl.play().catch(e => console.warn('Video play failed:', e));
    } catch (error) {
      console.warn(`Failed to start video for display ${displayId}:`, error);
    }
  }
  
  onDestroy(() => {
    stopVideoPreviews();
    unsubT();
  });
</script>

<Modal {open} onClose={onClose} title={t('pages.features.capture.selectDisplay')} size="large">
  <div class="screen-selection-modal">
    {#if isLoading}
      <div class="loading">
        <p>{t('common.states.loading')}</p>
      </div>
    {:else if displays.length === 0}
      <div class="no-displays">
        <p>{t('pages.features.capture.noDisplays')}</p>
      </div>
    {:else}
      <!-- Main Preview Area -->
      <div class="main-preview-container">
        {#if selectedDisplay === 'all'}
          <!-- All displays preview -->
          <div class="all-displays-preview">
            <div class="displays-grid">
              {#each displays as display}
                {@const source = screenSources.find(s => s.display_id === display.id || s.displayInfo?.id === display.id)}
                <div class="display-frame">
                  <video 
                    use:registerVideoElement={source?.display_id || source?.displayInfo?.id || display.id}
                    class="display-video"
                    autoplay
                    muted
                    playsinline
                  ></video>
                  {#if source?.thumbnail}
                    <img 
                      src={source.thumbnail} 
                      alt={display.name}
                      class="display-thumbnail-fallback"
                    />
                  {/if}
                  <span class="display-label">{display.name}</span>
                </div>
              {/each}
            </div>
          </div>
        {:else}
          <!-- Single display preview -->
          {@const selectedDisplayObj = displays.find(d => d.id === selectedDisplay)}
          {@const selectedSource = screenSources.find(s => s.display_id === selectedDisplay || s.displayInfo?.id === selectedDisplay)}
          {#if selectedDisplayObj}
            <div class="single-display-preview">
              <video 
                use:registerVideoElement={selectedSource?.display_id || selectedSource?.displayInfo?.id || selectedDisplay}
                class="main-preview-video"
                autoplay
                muted
                playsinline
              ></video>
              {#if selectedSource?.thumbnail}
                <img 
                  src={selectedSource.thumbnail} 
                  alt={selectedDisplayObj.name}
                  class="main-preview-thumbnail"
                />
              {/if}
              <div class="preview-info">
                <span class="preview-name">{selectedDisplayObj.name}</span>
                <span class="preview-resolution">
                  {selectedDisplayObj.bounds.width} × {selectedDisplayObj.bounds.height}
                  {#if selectedDisplayObj.scaleFactor !== 1}
                    (@{selectedDisplayObj.scaleFactor}x)
                  {/if}
                </span>
              </div>
            </div>
          {/if}
        {/if}
      </div>
      
      <!-- Selection Options Row -->
      <div class="display-options-row">
        <!-- All Displays option -->
        {#if displays.length > 1}
          <button
            type="button"
            class="display-selector"
            class:selected={selectedDisplay === 'all'}
            on:click={() => selectedDisplay = 'all'}
          >
            <svg class="selector-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="7" width="7" height="5" rx="1" />
              <rect x="14" y="7" width="7" height="5" rx="1" />
              <rect x="8.5" y="14" width="7" height="5" rx="1" />
            </svg>
            <span class="selector-label">{t('pages.features.capture.allDisplays')}</span>
          </button>
        {/if}
        
        <!-- Individual displays -->
        {#each displays as display, i}
          <button
            type="button"
            class="display-selector"
            class:selected={selectedDisplay === display.id}
            on:click={() => selectedDisplay = display.id}
          >
            <svg class="selector-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="8" width="12" height="8" rx="1" />
              {#if display.isPrimary}
                <circle cx="12" cy="19" r="1" />
              {/if}
            </svg>
            <span class="selector-label">
              {display.name}
              {#if display.isPrimary}
                <span class="primary-badge">Primary</span>
              {/if}
            </span>
          </button>
        {/each}
      </div>
      
      <div class="modal-actions">
        <button
          type="button"
          class="btn btn--secondary"
          on:click={onClose}
          disabled={isCapturing}
        >
          {t('common.actions.cancel')}
        </button>
        <button
          type="button"
          class="btn btn--primary"
          on:click={handleCapture}
          disabled={isCapturing || !selectedDisplay}
        >
          {#if isCapturing}
            {t('pages.features.capture.capturing')}
          {:else}
            {t('pages.features.capture.captureNow')}
          {/if}
        </button>
      </div>
    {/if}
  </div>
</Modal>

<style>
  .screen-selection-modal {
    /* Let the modal component handle responsive widths */
    width: 100%;
  }
  
  .loading,
  .no-displays {
    padding: 2rem;
    text-align: center;
    color: var(--color-text-muted, #6c757d);
  }
  
  /* Main Preview Area */
  .main-preview-container {
    width: 100%;
    height: 400px;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    margin-bottom: 1rem;
  }
  
  /* Single Display Preview */
  .single-display-preview {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .main-preview-video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  
  .main-preview-thumbnail {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    z-index: -1;
  }
  
  .preview-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1rem;
    background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .preview-name {
    font-weight: 600;
    font-size: 1rem;
  }
  
  .preview-resolution {
    font-size: 0.875rem;
    opacity: 0.9;
  }
  
  /* All Displays Preview */
  .all-displays-preview {
    width: 100%;
    height: 100%;
    padding: 1rem;
  }
  
  .displays-grid {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .display-frame {
    position: relative;
    background: #222;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .display-video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  
  .display-thumbnail-fallback {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    z-index: -1;
  }
  
  .display-label {
    position: absolute;
    bottom: 0.5rem;
    left: 0.5rem;
    right: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: rgba(0,0,0,0.7);
    color: white;
    font-size: 0.75rem;
    border-radius: 4px;
    text-align: center;
  }
  
  /* Display Selection Row */
  .display-options-row {
    display: flex;
    gap: 0.5rem;
    padding: 1rem 0;
    overflow-x: auto;
    border-top: 1px solid var(--color-border, #dee2e6);
    border-bottom: 1px solid var(--color-border, #dee2e6);
    margin-bottom: 1rem;
  }
  
  .display-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--color-bg-secondary, #f8f9fa);
    border: 2px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    flex-shrink: 0;
  }
  
  .display-selector:hover {
    background: var(--color-bg-hover, #e9ecef);
    transform: translateY(-1px);
  }
  
  .display-selector.selected {
    border-color: var(--color-primary, #007bff);
    background: var(--color-primary-light, #e7f3ff);
  }
  
  .selector-icon {
    color: var(--color-text-muted, #6c757d);
    flex-shrink: 0;
  }
  
  .display-selector.selected .selector-icon {
    color: var(--color-primary, #007bff);
  }
  
  .selector-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text, #333);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .primary-badge {
    padding: 0.125rem 0.375rem;
    background: var(--color-success, #28a745);
    color: white;
    font-size: 0.625rem;
    border-radius: 10px;
    text-transform: uppercase;
    font-weight: 600;
  }
  
  /* Modal Actions */
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
</style>