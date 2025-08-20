<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import ProgressBar from '@components/ProgressBar.svelte';
  import ScreenSelectionModal from '@components/computer/ScreenSelectionModal.svelte';
  import { captureState } from '@features/computer-capture/store';
  import { loadScreenshots } from '@features/computer-capture/service';
  import { t as tStore } from '@ts/i18n/store';
  
  export let savePath: string | undefined = undefined;
  
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  
  let isCapturing = false;
  let error: string | null = null;
  let showSuccess = false;
  let showModal = false;
  
  const unsubState = captureState.subscribe(state => {
    isCapturing = state.isCapturing;
    error = state.error;
    if (state.lastCapturedId && !isCapturing) {
      showSuccessMessage();
    }
  });
  
  function showSuccessMessage() {
    showSuccess = true;
    setTimeout(() => {
      showSuccess = false;
    }, 3000);
  }
  
  function handleOpenModal() {
    showModal = true;
  }
  
  function handleCloseModal() {
    showModal = false;
  }
  
  onMount(() => {
    loadScreenshots();
  });
  
  onDestroy(() => {
    unsubT();
    unsubState();
  });
</script>

<div class="capture-manager">
  <div class="capture-controls">
    <button 
      class="btn btn--primary capture-button"
      on:click={handleOpenModal}
      disabled={isCapturing}
      aria-label={t('pages.features.capture.recordScreen')}
    >
      <span class="capture-button__icon"></span>
      {t('pages.features.capture.recordScreen')}
    </button>
    
    {#if isCapturing}
      <div class="capture-progress">
        <ProgressBar />
      </div>
    {/if}
  </div>
  
  {#if showSuccess}
    <div class="capture-message capture-message--success" role="status">
      {t('pages.features.capture.success')}
    </div>
  {/if}
  
  {#if error}
    <div class="capture-message capture-message--error" role="alert">
      {error}
    </div>
  {/if}
</div>

<!-- Screen Selection Modal -->
<ScreenSelectionModal 
  open={showModal}
  onClose={handleCloseModal}
  {savePath}
/>

<style>
  .capture-manager {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .capture-controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
  
  .capture-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
  }
  
  .capture-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .capture-button__icon {
    width: 20px;
    height: 20px;
    border: 2px solid currentColor;
    border-radius: 4px;
    position: relative;
  }
  
  .capture-button__icon::after {
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
  
  .capture-button__icon.capturing {
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
  
  .capture-progress {
    width: 200px;
  }
  
  .capture-message {
    padding: 0.75rem 1rem;
    border-radius: 4px;
    font-size: 0.875rem;
    animation: slideIn 0.3s ease-out;
  }
  
  .capture-message--success {
    background: var(--color-success-bg, #d4edda);
    color: var(--color-success-text, #155724);
    border: 1px solid var(--color-success-border, #c3e6cb);
  }
  
  .capture-message--error {
    background: var(--color-error-bg, #f8d7da);
    color: var(--color-error-text, #721c24);
    border: 1px solid var(--color-error-border, #f5c6cb);
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>