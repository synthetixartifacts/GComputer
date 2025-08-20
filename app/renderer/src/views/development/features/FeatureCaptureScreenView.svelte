<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import CaptureManager from '@components/computer/CaptureManager.svelte';
  import GalleryGrid from '@components/GalleryGrid.svelte';
  import Modal from '@components/Modal.svelte';
  import { captureState } from '@features/computer-capture/store';
  import { 
    loadScreenshots, 
    deleteScreenshot, 
    getScreenshotData,
    formatFileSize,
    formatTimestamp,
    downloadScreenshotById,
    copyScreenshotToClipboard
  } from '@features/computer-capture/service';
  import { t as tStore } from '@ts/i18n/store';
  import type { Screenshot } from '@features/computer-capture/types';
  
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  
  let screenshots: Screenshot[] = [];
  let isLoading = false;
  let selectedScreenshot: Screenshot | null = null;
  let selectedImage: string | null = null;
  let showDeleteConfirm = false;
  let screenshotToDelete: Screenshot | null = null;
  let showDeleteAllConfirm = false;
  
  let thumbnailsMap = new Map<string, string>();
  
  const unsubState = captureState.subscribe(state => {
    screenshots = state.screenshots;
    isLoading = state.isLoading;
    // Load thumbnails when screenshots change
    if (screenshots.length > 0 && !isLoading) {
      loadThumbnails();
    }
  });
  
  // Convert screenshots to gallery items with loaded thumbnails
  let galleryItems: any[] = [];
  $: galleryItems = screenshots.map(screenshot => ({
    id: screenshot.id,
    src: thumbnailsMap.get(screenshot.id) || '',
    alt: `Screenshot ${screenshot.filename}`,
    caption: `${formatTimestamp(screenshot.createdAt)} • ${formatFileSize(screenshot.size)}`
  }));
  
  async function handleSelectScreenshot(item: any) {
    const screenshot = screenshots.find(s => s.id === item.id);
    if (screenshot) {
      selectedScreenshot = screenshot;
      const data = await getScreenshotData(screenshot.filename);
      if (data) {
        selectedImage = data;
      }
    }
  }
  
  function closePreview() {
    selectedScreenshot = null;
    selectedImage = null;
  }
  
  function confirmDelete(screenshot: Screenshot) {
    screenshotToDelete = screenshot;
    showDeleteConfirm = true;
  }
  
  async function handleDelete() {
    if (screenshotToDelete) {
      const deletedId = screenshotToDelete.id;
      const success = await deleteScreenshot(screenshotToDelete.filename, screenshotToDelete.id);
      
      if (success) {
        showDeleteConfirm = false;
        // Close preview if we're deleting the currently viewed screenshot
        if (selectedScreenshot?.id === deletedId) {
          closePreview();
        }
        screenshotToDelete = null;
      }
    }
  }
  
  function cancelDelete() {
    showDeleteConfirm = false;
    screenshotToDelete = null;
  }
  
  async function handleDownload() {
    if (selectedScreenshot) {
      await downloadScreenshotById(selectedScreenshot);
    }
  }
  
  async function handleCopyToClipboard() {
    if (selectedScreenshot) {
      const success = await copyScreenshotToClipboard(selectedScreenshot.filename);
      if (success) {
        // Show success message (you could add a toast notification here)
        console.log('Screenshot copied to clipboard');
      }
    }
  }
  
  function confirmDeleteAll() {
    showDeleteAllConfirm = true;
  }
  
  async function handleDeleteAll() {
    if (screenshots.length === 0) return;
    
    let deletedCount = 0;
    const totalCount = screenshots.length;
    
    // Delete all screenshots one by one
    for (const screenshot of screenshots) {
      const success = await deleteScreenshot(screenshot.filename, screenshot.id);
      if (success) {
        deletedCount++;
      }
    }
    
    // Clear thumbnails map
    thumbnailsMap.clear();
    thumbnailsMap = thumbnailsMap; // Trigger reactivity
    
    // Close any open preview
    if (selectedScreenshot) {
      closePreview();
    }
    
    showDeleteAllConfirm = false;
    
    // Show result message
    if (deletedCount === totalCount) {
      console.log(`Successfully deleted all ${deletedCount} screenshots`);
    } else {
      console.log(`Deleted ${deletedCount} of ${totalCount} screenshots`);
    }
  }
  
  function cancelDeleteAll() {
    showDeleteAllConfirm = false;
  }
  
  // Load screenshot thumbnails for gallery
  async function loadThumbnails() {
    for (const screenshot of screenshots) {
      // Only load if not already in map
      if (!thumbnailsMap.has(screenshot.id)) {
        const data = await getScreenshotData(screenshot.filename);
        if (data) {
          thumbnailsMap.set(screenshot.id, data);
          // Trigger reactivity by reassigning the map
          thumbnailsMap = thumbnailsMap;
        }
      }
    }
  }
  
  onMount(() => {
    loadScreenshots().then(() => {
      loadThumbnails();
    });
  });
  
  onDestroy(() => {
    unsubT();
    unsubState();
  });
</script>

<section class="container-page stack-lg">
  <div class="capture-header">
    <h2 class="text-2xl font-bold">{t('pages.features.capture.title')}</h2>
    <p class="text-muted">{t('pages.features.capture.description')}</p>
  </div>
  
  <div class="capture-section">
    <!-- Screenshots are saved in the app's userData directory -->
    <CaptureManager />
  </div>
  
  <div class="gallery-section">
    <div class="gallery-header">
      <h3 class="text-xl font-semibold">{t('pages.features.capture.gallery')}</h3>
      {#if screenshots.length > 0}
        <button 
          class="btn btn--danger btn--small"
          on:click={confirmDeleteAll}
          title={t('pages.features.capture.deleteAll')}
        >
          🗑️ {t('pages.features.capture.deleteAll')}
        </button>
      {/if}
    </div>
    
    {#if isLoading}
      <p class="text-muted">{t('common.states.loading')}</p>
    {:else if screenshots.length === 0}
      <p class="text-muted">{t('pages.features.capture.noScreenshots')}</p>
    {:else}
      <div class="gallery-container">
        <GalleryGrid 
          items={galleryItems}
          columns={{ base: 2, md: 3, lg: 4 }}
          onSelect={handleSelectScreenshot}
          ariaLabel={t('pages.features.capture.gallery')}
        />
      </div>
      
      <div class="gallery-info">
        <p class="text-sm text-muted">
          {t('pages.features.capture.totalScreenshots', { count: screenshots.length })}
        </p>
      </div>
    {/if}
  </div>
</section>

<!-- Screenshot Preview Modal -->
{#if selectedScreenshot && selectedImage}
  <Modal 
    open={true} 
    onClose={closePreview}
    title={selectedScreenshot.filename}
  >
    <div class="preview-modal">
      <img 
        src={selectedImage} 
        alt={`Screenshot ${selectedScreenshot.filename}`}
        class="preview-image"
      />
      <div class="preview-info">
        <p><strong>{t('pages.features.capture.dimensions')}:</strong> {selectedScreenshot.width} × {selectedScreenshot.height}</p>
        <p><strong>{t('pages.features.capture.size')}:</strong> {formatFileSize(selectedScreenshot.size)}</p>
        <p><strong>{t('pages.features.capture.captured')}:</strong> {new Date(selectedScreenshot.createdAt).toLocaleString()}</p>
      </div>
      <div class="preview-actions">
        <button 
          class="btn btn--secondary"
          on:click={handleCopyToClipboard}
          title={t('common.actions.copy')}
        >
          📋 {t('common.actions.copy')}
        </button>
        <button 
          class="btn btn--secondary"
          on:click={handleDownload}
          title={t('common.actions.download')}
        >
          ⬇️ {t('common.actions.download')}
        </button>
        <button 
          class="btn btn--danger"
          on:click={() => confirmDelete(selectedScreenshot)}
        >
          {t('common.actions.delete')}
        </button>
      </div>
    </div>
  </Modal>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm && screenshotToDelete}
  <Modal 
    open={true} 
    onClose={cancelDelete}
    title={t('pages.features.capture.confirmDelete')}
  >
    <div class="delete-confirm">
      <p>{t('pages.features.capture.deleteMessage', { filename: screenshotToDelete.filename })}</p>
      <div class="modal-actions">
        <button class="btn btn--secondary" on:click={cancelDelete}>
          {t('common.actions.cancel')}
        </button>
        <button class="btn btn--danger" on:click={handleDelete}>
          {t('common.actions.delete')}
        </button>
      </div>
    </div>
  </Modal>
{/if}

<!-- Delete All Confirmation Modal -->
{#if showDeleteAllConfirm}
  <Modal 
    open={true} 
    onClose={cancelDeleteAll}
    title={t('pages.features.capture.confirmDeleteAll')}
  >
    <div class="delete-confirm">
      <div class="warning-icon">⚠️</div>
      <p class="warning-text">
        {t('pages.features.capture.deleteAllWarning', { count: screenshots.length })}
      </p>
      <p class="warning-subtext">
        {t('pages.features.capture.deleteAllWarningDetail')}
      </p>
      <div class="modal-actions">
        <button class="btn btn--secondary" on:click={cancelDeleteAll}>
          {t('common.actions.cancel')}
        </button>
        <button class="btn btn--danger" on:click={handleDeleteAll}>
          🗑️ {t('pages.features.capture.deleteAllConfirm')}
        </button>
      </div>
    </div>
  </Modal>
{/if}

<style>
  .capture-header {
    margin-bottom: 2rem;
  }
  
  .capture-section {
    margin-bottom: 3rem;
    padding: 2rem;
    background: var(--color-bg-secondary, #f8f9fa);
    border-radius: 8px;
  }
  
  .gallery-section {
    margin-bottom: 2rem;
  }
  
  .gallery-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .btn--small {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
  
  .gallery-container {
    margin-bottom: 1rem;
  }
  
  .gallery-info {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border, #dee2e6);
  }
  
  .text-muted {
    color: var(--color-text-muted, #6c757d);
  }
  
  .preview-modal {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .preview-image {
    width: 100%;
    height: auto;
    max-height: 60vh;
    object-fit: contain;
    border: 1px solid var(--color-border, #dee2e6);
    border-radius: 4px;
  }
  
  .preview-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--color-bg-secondary, #f8f9fa);
    border-radius: 4px;
    font-size: 0.875rem;
  }
  
  .preview-info p {
    margin: 0;
  }
  
  .preview-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border, #dee2e6);
  }
  
  .delete-confirm {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
  
  .warning-icon {
    font-size: 3rem;
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .warning-text {
    font-size: 1.1rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    text-align: center;
  }
  
  .warning-subtext {
    color: var(--color-text-muted, #6c757d);
    text-align: center;
    margin-bottom: 1.5rem;
  }
  
  .btn--danger {
    background: var(--color-danger, #dc3545);
    color: white;
  }
  
  .btn--danger:hover {
    background: var(--color-danger-hover, #c82333);
  }
</style>