<script lang="ts">
  import { onDestroy } from 'svelte';
  import Modal from '@components/Modal.svelte';
  import LiveScreenPreview from '@components/computer/LiveScreenPreview.svelte';
  import CaptureScreen from '@components/computer/CaptureScreen.svelte';
  import { t as tStore } from '@ts/i18n/store';
  export let open: boolean = false;
  export let onClose: () => void;
  export let savePath: string | undefined = undefined;
  
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  
  let selectedDisplay: string | 'all' = 'all';
  let isCapturing = false;
  let captureError: string | null = null;
  let captureSuccess = false;
  
  let livePreview: LiveScreenPreview;
  let captureScreen: CaptureScreen;
  
  async function handleCapture() {
    if (!captureScreen || isCapturing) return;
    
    // Stop previews before capturing to free resources
    livePreview?.stopPreviews();
    
    await captureScreen.capture(selectedDisplay, savePath);
  }
  
  function handleCaptureComplete(success: boolean, error?: string) {
    isCapturing = false; // Reset capturing state
    
    if (success) {
      // Show success message
      captureError = null;
      captureSuccess = true;
      
      // Hide success message after 2 seconds
      setTimeout(() => {
        captureSuccess = false;
      }, 2000);
      
      // Restart preview for next capture
      setTimeout(() => {
        livePreview?.restartPreviews();
      }, 500);
    } else {
      captureError = error || 'Capture failed';
      captureSuccess = false;
      // Restart previews if capture failed
      setTimeout(() => livePreview?.restartPreviews(), 100);
    }
  }
  
  function handleCaptureStart() {
    isCapturing = true;
    captureError = null;
    captureSuccess = false;
  }
  
  function handleClose() {
    // Stop preview when closing
    livePreview?.stopPreviews();
    onClose();
  }
  
  // Stop previews when modal closes
  $: if (!open && livePreview) {
    livePreview.stopPreviews();
  }
  
  onDestroy(() => {
    unsubT();
  });
</script>

<Modal {open} onClose={handleClose} title={t('pages.features.capture.selectDisplay')} size="large">
  <div class="screen-selection-modal">
    <!-- Live preview component -->
    <LiveScreenPreview
      bind:this={livePreview}
      bind:selectedDisplay
      autoStart={open}
      showControls={true}
      onSelectionChange={(displayId) => selectedDisplay = displayId}
    />
    
    <!-- Capture logic component (headless) -->
    <CaptureScreen
      bind:this={captureScreen}
      onCaptureComplete={handleCaptureComplete}
      onCaptureStart={handleCaptureStart}
    />
    
    {#if captureSuccess}
      <div class="screen-selection-modal__success">
        <p>✅ {t('pages.features.capture.success')}</p>
      </div>
    {/if}
    
    {#if captureError}
      <div class="screen-selection-modal__error">
        <p>{captureError}</p>
      </div>
    {/if}
    
    <div class="screen-selection-modal__actions">
      <button
        type="button"
        class="btn btn--secondary"
        on:click={handleClose}
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
  </div>
</Modal>