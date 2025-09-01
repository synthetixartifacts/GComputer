<script lang="ts">
  import { onMount } from 'svelte';
  import CaptureScreen from '@components/computer/CaptureScreen.svelte';
  import type { VisionImage } from '@features/vision';
  import { imageToBase64 } from '@features/vision';
  import { t } from '@ts/i18n';

  interface Props {
    images?: VisionImage[];
    onImagesChange?: (images: VisionImage[]) => void;
    maxImages?: number;
    maxSize?: number;
    allowScreenCapture?: boolean;
  }

  let {
    images = $bindable([]),
    onImagesChange,
    maxImages = 10,
    maxSize = 20 * 1024 * 1024, // 20MB
    allowScreenCapture = true
  }: Props = $props();

  let fileInput: HTMLInputElement | undefined = $state();
  let isDragging = $state(false);

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      await addFiles(Array.from(target.files));
    }
  }

  async function addFiles(files: File[]) {
    const newImages: VisionImage[] = [];
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        console.warn('Skipping non-image file:', file.name);
        continue;
      }

      if (file.size > maxSize) {
        console.warn('File too large:', file.name);
        continue;
      }

      if (images.length + newImages.length >= maxImages) {
        console.warn('Maximum images reached');
        break;
      }

      try {
        const base64 = await imageToBase64(file);
        newImages.push({
          base64,
          format: 'base64',
          detail: 'auto'
        });
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }

    if (newImages.length > 0) {
      images = [...images, ...newImages];
      onImagesChange?.(images);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;

    if (event.dataTransfer?.files) {
      await addFiles(Array.from(event.dataTransfer.files));
    }
  }

  function removeImage(index: number) {
    images = images.filter((_, i) => i !== index);
    onImagesChange?.(images);
  }

  function clearImages() {
    images = [];
    onImagesChange?.(images);
  }

  async function handleScreenCapture(event: CustomEvent<{ dataUrl: string }>) {
    if (images.length >= maxImages) {
      console.warn('Maximum images reached');
      return;
    }

    const base64 = event.detail.dataUrl.split(',')[1];
    images = [...images, {
      base64,
      format: 'base64',
      detail: 'high'
    }];
    onImagesChange?.(images);
  }

  function triggerFileInput() {
    fileInput?.click();
  }
</script>

<div class="vision-uploader">
  <input
    bind:this={fileInput}
    type="file"
    accept="image/*"
    multiple
    onchange={handleFileSelect}
    class="hidden"
  />

  <div 
    class="upload-area"
    class:dragging={isDragging}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  >
    {#if images.length === 0}
      <div class="upload-prompt">
        <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <p>{$t('vision.drag_drop')}</p>
        <p class="text-sm">{$t('vision.or')}</p>
        <button onclick={triggerFileInput} class="btn btn-primary">
          {$t('vision.browse_files')}
        </button>
        {#if allowScreenCapture}
          <CaptureScreen 
            on:capture={handleScreenCapture}
            buttonText={$t('vision.capture_screen')}
          />
        {/if}
      </div>
    {:else}
      <div class="image-grid">
        {#each images as image, index}
          <div class="image-preview">
            <img 
              src={image.url || `data:image/jpeg;base64,${image.base64}`} 
              alt={`Image ${index + 1}`}
            />
            <button 
              onclick={() => removeImage(index)}
              class="remove-button"
              aria-label={$t('common.remove')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        {/each}
        {#if images.length < maxImages}
          <div class="add-more">
            <button onclick={triggerFileInput} class="add-button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              {$t('vision.add_more')}
            </button>
          </div>
        {/if}
      </div>
      <div class="image-actions">
        <span class="image-count">
          {images.length} / {maxImages} {$t('vision.images')}
        </span>
        <button onclick={clearImages} class="btn btn-secondary">
          {$t('common.clear_all')}
        </button>
      </div>
    {/if}
  </div>
</div>