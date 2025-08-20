<script lang="ts">
  import { onDestroy } from 'svelte';
  import { captureDisplay, captureAllDisplays } from '@features/computer-capture/service';
  import { captureState } from '@features/computer-capture/store';
  import type { DisplayInfo } from '@features/computer-capture/types';
  
  export let onCaptureComplete: (success: boolean, error?: string) => void = () => {};
  export let onCaptureStart: () => void = () => {};
  
  let isCapturing = false;
  let error: string | null = null;
  
  const unsubState = captureState.subscribe(state => {
    isCapturing = state.isCapturing;
    error = state.error;
  });
  
  export async function capture(displayId: string | 'all', savePath?: string) {
    if (!displayId) {
      const errorMsg = 'No display selected for capture';
      error = errorMsg;
      onCaptureComplete(false, errorMsg);
      return;
    }
    
    if (isCapturing) {
      const errorMsg = 'Capture already in progress';
      onCaptureComplete(false, errorMsg);
      return;
    }
    
    onCaptureStart();
    error = null;
    
    try {
      if (displayId === 'all') {
        await captureAllDisplays(savePath);
      } else {
        await captureDisplay(displayId, savePath);
      }
      
      onCaptureComplete(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown capture error';
      error = errorMsg;
      onCaptureComplete(false, errorMsg);
    }
  }
  
  export function isReady(): boolean {
    return !isCapturing;
  }
  
  export function getError(): string | null {
    return error;
  }
  
  export function clearError() {
    error = null;
  }
  
  
  onDestroy(() => {
    unsubState();
  });
</script>

{#if $$slots.default}
  <slot {isCapturing} {error} {capture} />
{/if}