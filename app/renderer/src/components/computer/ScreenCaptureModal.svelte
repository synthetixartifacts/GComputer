<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Modal from '@components/Modal.svelte';
  import { t as tStore } from '@ts/i18n/store';
  
  export let open: boolean = false;
  export let onClose: () => void;
  export let onCapture: (sourceId?: string) => Promise<void>;
  export let savePath: string | undefined = undefined;
  
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  
  let videoElement: HTMLVideoElement;
  let stream: MediaStream | null = null;
  let sources: any[] = [];
  let selectedSourceId: string = '';
  let isCapturing = false;
  let isLoadingPreview = false;
  
  // Get available screen sources
  async function loadSources() {
    if (typeof window !== 'undefined' && window.gc?.screen) {
      try {
        sources = await window.gc.screen.getSources();
        if (sources.length > 0 && !selectedSourceId) {
          selectedSourceId = sources[0].id;
          await startPreview(sources[0].id);
        }
      } catch (error) {
        console.error('Failed to get screen sources:', error);
      }
    }
  }
  
  // Start video preview for selected source
  async function startPreview(sourceId: string) {
    try {
      isLoadingPreview = true;
      
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
      
      // Create constraints for getUserMedia
      const constraints: any = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId
          }
        }
      };
      
      // Get the stream
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Set video source
      if (videoElement) {
        videoElement.srcObject = stream;
        await videoElement.play();
      }
    } catch (error) {
      console.error('Failed to start preview:', error);
      // In WSL2 or when getUserMedia fails, we can show a static preview
      // using the thumbnail from the source
      const source = sources.find(s => s.id === sourceId);
      if (source && source.thumbnail && videoElement) {
        // Create a fallback image display
        const img = new Image();
        img.src = source.thumbnail;
        // We'll handle this in the template with a fallback image
      }
    } finally {
      isLoadingPreview = false;
    }
  }
  
  // Handle source selection change
  async function handleSourceChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    selectedSourceId = select.value;
    await startPreview(selectedSourceId);
  }
  
  // Handle capture button click
  async function handleCapture() {
    if (isCapturing) return;
    
    try {
      isCapturing = true;
      await onCapture(selectedSourceId);
      
      // Close modal after successful capture
      handleClose();
    } catch (error) {
      console.error('Capture failed:', error);
      isCapturing = false;
    }
  }
  
  // Clean up when closing
  function handleClose() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    onClose();
  }
  
  // Load sources when modal opens
  $: if (open) {
    loadSources();
  }
  
  onDestroy(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    unsubT();
  });
</script>

<Modal {open} onClose={handleClose} title={t('pages.features.capture.recordModalTitle')}>
  <div class="capture-modal">
    {#if sources.length > 1}
      <div class="source-selector">
        <label for="screen-source">{t('pages.features.capture.selectScreen')}:</label>
        <select 
          id="screen-source" 
          bind:value={selectedSourceId} 
          on:change={handleSourceChange}
          class="select"
        >
          {#each sources as source}
            <option value={source.id}>{source.name}</option>
          {/each}
        </select>
      </div>
    {/if}
    
    <div class="preview-container">
      {#if isLoadingPreview}
        <div class="preview-loading">
          <span>{t('common.states.loading')}</span>
        </div>
      {/if}
      
      <!-- Video element for live preview -->
      <video 
        bind:this={videoElement}
        class="preview-video"
        autoplay
        muted
        playsinline
      ></video>
      
      <!-- Fallback for WSL2 or when video fails -->
      {#if !stream && selectedSourceId && sources.length > 0}
        {@const source = sources.find(s => s.id === selectedSourceId)}
        {#if source?.thumbnail}
          <img 
            src={source.thumbnail} 
            alt={t('pages.features.capture.preview')}
            class="preview-fallback"
          />
        {/if}
      {/if}
    </div>
    
    {#if savePath}
      <div class="save-path-info">
        <small>{t('pages.features.capture.saveTo')}: {savePath}</small>
      </div>
    {/if}
    
    <div class="capture-actions">
      <button 
        class="btn btn--secondary"
        on:click={handleClose}
        disabled={isCapturing}
      >
        {t('common.actions.cancel')}
      </button>
      <button 
        class="btn btn--primary capture-btn"
        on:click={handleCapture}
        disabled={isCapturing || sources.length === 0}
      >
        {#if isCapturing}
          <span class="capture-icon capturing"></span>
          {t('pages.features.capture.capturing')}
        {:else}
          <span class="capture-icon"></span>
          {t('pages.features.capture.captureNow')}
        {/if}
      </button>
    </div>
  </div>
</Modal>

<style>
  .capture-modal {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 600px;
  }
  
  .source-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .source-selector label {
    font-weight: 500;
  }
  
  .select {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--color-border, #dee2e6);
    border-radius: 4px;
    background: var(--color-bg, white);
  }
  
  .preview-container {
    position: relative;
    width: 100%;
    height: 400px;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .preview-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 1.2rem;
  }
  
  .preview-video,
  .preview-fallback {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  
  .save-path-info {
    padding: 0.5rem;
    background: var(--color-bg-secondary, #f8f9fa);
    border-radius: 4px;
    color: var(--color-text-muted, #6c757d);
  }
  
  .capture-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border, #dee2e6);
  }
  
  .capture-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .capture-icon {
    width: 20px;
    height: 20px;
    border: 2px solid currentColor;
    border-radius: 50%;
    position: relative;
  }
  
  .capture-icon::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 8px;
    height: 8px;
    background: currentColor;
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }
  
  .capture-icon.capturing {
    animation: pulse 1s infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>