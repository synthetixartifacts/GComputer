<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { t as tStore } from '@ts/i18n/store';
  import { getAvailableDisplays } from '@features/computer-capture/service';
  import type { DisplayInfo } from '@features/computer-capture/types';
  
  export let onSelectionChange: (displayId: string | 'all') => void = () => {};
  export let selectedDisplay: string | 'all' = 'all';
  export let autoStart: boolean = true;
  export let showControls: boolean = true;
  
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  
  let displays: DisplayInfo[] = [];
  let isLoading = true;
  let screenSources: any[] = [];
  let currentStream: MediaStream | null = null;
  let videoElement: HTMLVideoElement;
  let previewError: string | null = null;
  
  async function loadDisplays() {
    isLoading = true;
    previewError = null;
    try {
      displays = await getAvailableDisplays();
      
      if (window.gc?.screen?.getSources) {
        screenSources = await window.gc.screen.getSources();
      }
      
      if (displays.length === 1) {
        selectedDisplay = displays[0].id;
      }
      
      notifySelectionChange();
      
      if (autoStart) {
        await startPreview();
      }
    } catch (error) {
      console.error('[LiveScreenPreview] Failed to load displays:', error);
      previewError = 'Failed to load displays';
    } finally {
      isLoading = false;
    }
  }
  
  function notifySelectionChange() {
    onSelectionChange(selectedDisplay);
  }
  
  async function startPreview() {
    console.log('[LiveScreenPreview] Starting preview for:', selectedDisplay);
    previewError = null;
    
    // Stop any existing stream first
    stopPreviews();
    
    if (!videoElement) {
      console.warn('[LiveScreenPreview] Video element not ready');
      return;
    }
    
    try {
      // Use the modern getDisplayMedia API which works with setDisplayMediaRequestHandler
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: false
      });
      
      console.log('[LiveScreenPreview] Got stream:', stream);
      currentStream = stream;
      
      // Set the stream to video element
      videoElement.srcObject = stream;
      
      // Wait for metadata to be loaded
      await new Promise<void>((resolve, reject) => {
        videoElement.onloadedmetadata = () => {
          console.log('[LiveScreenPreview] Video metadata loaded');
          resolve();
        };
        videoElement.onerror = (e) => {
          console.error('[LiveScreenPreview] Video error:', e);
          reject(e);
        };
        // Add timeout
        setTimeout(() => reject(new Error('Video loading timeout')), 5000);
      });
      
      // Play the video
      await videoElement.play();
      console.log('[LiveScreenPreview] Video playing');
      
      // Add stream end handler
      stream.getVideoTracks()[0].onended = () => {
        console.log('[LiveScreenPreview] Stream ended');
        stopPreviews();
      };
      
    } catch (error) {
      console.error('[LiveScreenPreview] Failed to start preview:', error);
      
      // Fallback to getUserMedia with desktop constraints if getDisplayMedia fails
      try {
        console.log('[LiveScreenPreview] Trying fallback with getUserMedia');
        
        // Get the first available source
        const source = screenSources[0];
        if (!source) {
          throw new Error('No screen sources available');
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: source.id,
              minWidth: 1280,
              maxWidth: 1920,
              minHeight: 720,
              maxHeight: 1080
            }
          } as any
        });
        
        currentStream = stream;
        videoElement.srcObject = stream;
        await videoElement.play();
        console.log('[LiveScreenPreview] Fallback preview started');
        
      } catch (fallbackError) {
        console.error('[LiveScreenPreview] Fallback also failed:', fallbackError);
        previewError = 'Unable to start screen preview. Please check permissions.';
      }
    }
  }
  
  export function stopPreviews() {
    console.log('[LiveScreenPreview] Stopping previews');
    
    if (currentStream) {
      currentStream.getTracks().forEach(track => {
        track.stop();
      });
      currentStream = null;
    }
    
    if (videoElement && videoElement.srcObject) {
      videoElement.srcObject = null;
    }
  }
  
  export function restartPreviews() {
    console.log('[LiveScreenPreview] Restarting previews');
    stopPreviews();
    setTimeout(() => startPreview(), 100);
  }
  
  function handleDisplaySelection(displayId: string | 'all') {
    selectedDisplay = displayId;
    notifySelectionChange();
    // Restart preview with new selection
    restartPreviews();
  }
  
  export function getDisplays(): DisplayInfo[] {
    return displays;
  }
  
  onMount(() => {
    loadDisplays();
  });
  
  onDestroy(() => {
    stopPreviews();
    unsubT();
  });
</script>

<div class="live-screen-preview">
  {#if isLoading}
    <div class="live-screen-preview__loading">
      <p>{t('common.states.loading')}</p>
    </div>
  {:else if displays.length === 0}
    <div class="live-screen-preview__no-displays">
      <p>{t('pages.features.capture.noDisplays')}</p>
    </div>
  {:else}
    <div class="live-screen-preview__container">
      <video 
        bind:this={videoElement}
        class="live-screen-preview__video"
        autoplay
        muted
        playsinline
      ></video>
      
      {#if previewError}
        <div class="live-screen-preview__error">
          <p>{previewError}</p>
          <button 
            class="btn btn--secondary"
            on:click={restartPreviews}
          >
            {t('common.actions.retry')}
          </button>
        </div>
      {/if}
      
      {#if !currentStream && !previewError && !isLoading}
        <div class="live-screen-preview__placeholder">
          <p>{t('pages.features.capture.clickToStartPreview')}</p>
          <button 
            class="btn btn--primary"
            on:click={startPreview}
          >
            {t('pages.features.capture.startPreview')}
          </button>
        </div>
      {/if}
    </div>
    
    {#if showControls}
      <div class="display-selector-row">
        {#if displays.length > 1}
          <button
            type="button"
            class="display-selector"
            class:selected={selectedDisplay === 'all'}
            on:click={() => handleDisplaySelection('all')}
          >
            <svg class="display-selector__icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="7" width="7" height="5" rx="1" />
              <rect x="14" y="7" width="7" height="5" rx="1" />
              <rect x="8.5" y="14" width="7" height="5" rx="1" />
            </svg>
            <span class="display-selector__label">{t('pages.features.capture.allDisplays')}</span>
          </button>
        {/if}
        
        {#each displays as display}
          <button
            type="button"
            class="display-selector"
            class:selected={selectedDisplay === display.id}
            on:click={() => handleDisplaySelection(display.id)}
          >
            <svg class="display-selector__icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="8" width="12" height="8" rx="1" />
              {#if display.isPrimary}
                <circle cx="12" cy="19" r="1" />
              {/if}
            </svg>
            <span class="display-selector__label">
              {display.name}
              {#if display.isPrimary}
                <span class="display-selector__badge">Primary</span>
              {/if}
            </span>
          </button>
        {/each}
      </div>
    {/if}
  {/if}
</div>