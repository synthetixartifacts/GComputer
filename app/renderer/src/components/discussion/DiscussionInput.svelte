<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { t } from '@ts/i18n';
  
  export let disabled: boolean = false;
  export let placeholder: string = '';
  export let maxLength: number = 10000;
  export let allowFiles: boolean = false;
  export let allowVoice: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  let inputValue = '';
  let textarea: HTMLTextAreaElement;
  let files: File[] = [];
  let isRecording = false;
  let wordCount = 0;
  let charCount = 0;
  
  $: {
    charCount = inputValue.length;
    wordCount = inputValue.trim() ? inputValue.trim().split(/\s+/).length : 0;
  }
  
  $: canSend = inputValue.trim().length > 0 && !disabled;
  
  onMount(() => {
    // Auto-resize textarea
    if (textarea) {
      textarea.addEventListener('input', autoResize);
      autoResize();
    }
  });
  
  function autoResize() {
    if (!textarea) return;
    textarea.style.height = 'auto';
    const maxHeight = 200;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    // Send on Enter (without Shift)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }
  
  function handleSend() {
    if (!canSend) return;
    
    const message = inputValue.trim();
    
    dispatch('send', { 
      message,
      files: files.map(f => ({ 
        name: f.name, 
        size: f.size, 
        type: f.type 
      }))
    });
    
    // Clear input
    inputValue = '';
    files = [];
    if (textarea) {
      textarea.style.height = 'auto';
    }
  }
  
  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      files = [...files, ...Array.from(input.files)];
      dispatch('filesSelected', { files });
    }
  }
  
  function removeFile(index: number) {
    files = files.filter((_, i) => i !== index);
  }
  
  function toggleRecording() {
    isRecording = !isRecording;
    dispatch('recordingToggle', { isRecording });
    
    if (isRecording) {
      // Start recording logic would go here
      setTimeout(() => {
        isRecording = false;
        dispatch('recordingComplete', { transcript: 'Voice input would go here' });
      }, 3000);
    }
  }
  
  function handleStop() {
    dispatch('stop');
  }
</script>

<div class="discussion-input">
  <!-- File attachments preview -->
  {#if files.length > 0}
    <div class="file-attachments">
      {#each files as file, index}
        <div class="file-attachment">
          <span class="file-name">{file.name}</span>
          <button 
            class="remove-file" 
            on:click={() => removeFile(index)}
            type="button"
            aria-label="Remove file"
          >
            ×
          </button>
        </div>
      {/each}
    </div>
  {/if}
  
  <!-- Main input area -->
  <div class="input-container">
    <div class="input-wrapper">
      <textarea
        bind:this={textarea}
        bind:value={inputValue}
        {disabled}
        {placeholder}
        {maxLength}
        on:keydown={handleKeyDown}
        class="message-input"
        rows="1"
        aria-label="Message input"
      />
      
      <!-- Character/word count -->
      <div class="input-stats">
        <span class="word-count">{wordCount} words</span>
        <span class="char-count" class:warning={charCount > maxLength * 0.9}>
          {charCount}/{maxLength}
        </span>
      </div>
    </div>
    
    <!-- Action buttons -->
    <div class="input-actions">
      {#if allowFiles}
        <button 
          type="button"
          class="action-btn file-btn"
          {disabled}
          aria-label="Attach file"
        >
          <label for="file-input" class="file-label">
            📎
            <input
              id="file-input"
              type="file"
              multiple
              on:change={handleFileSelect}
              class="hidden-input"
              {disabled}
            />
          </label>
        </button>
      {/if}
      
      {#if allowVoice}
        <button
          type="button"
          class="action-btn voice-btn"
          class:recording={isRecording}
          on:click={toggleRecording}
          {disabled}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? '⏹️' : '🎤'}
        </button>
      {/if}
      
      {#if disabled}
        <button
          type="button"
          class="action-btn stop-btn"
          on:click={handleStop}
          aria-label="Stop generating"
        >
          ⏸️
        </button>
      {/if}
      
      <button
        type="button"
        class="send-btn"
        class:can-send={canSend}
        on:click={handleSend}
        disabled={!canSend}
        aria-label="Send message"
      >
        {#if disabled}
          <span class="sending-indicator">⏳</span>
        {:else}
          ➤
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .discussion-input {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    background: var(--color-bg-primary);
    border-top: 1px solid var(--color-border);
  }
  
  .file-attachments {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) 0;
  }
  
  .file-attachment {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
  }
  
  .remove-file {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: 1.25rem;
    line-height: 1;
    padding: 0;
    margin: 0;
  }
  
  .remove-file:hover {
    color: var(--color-danger);
  }
  
  .input-container {
    display: flex;
    gap: var(--spacing-sm);
    align-items: flex-end;
  }
  
  .input-wrapper {
    flex: 1;
    position: relative;
  }
  
  .message-input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    padding-bottom: 1.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    font-family: inherit;
    font-size: 1rem;
    resize: none;
    overflow-y: auto;
    min-height: 44px;
    max-height: 200px;
  }
  
  .message-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }
  
  .message-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .input-stats {
    position: absolute;
    bottom: var(--spacing-xs);
    left: var(--spacing-md);
    display: flex;
    gap: var(--spacing-md);
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }
  
  .char-count.warning {
    color: var(--color-warning);
  }
  
  .input-actions {
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;
  }
  
  .action-btn {
    padding: var(--spacing-sm);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1.25rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
  }
  
  .action-btn:hover:not(:disabled) {
    background: var(--color-bg-tertiary);
  }
  
  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .file-label {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .hidden-input {
    display: none;
  }
  
  .voice-btn.recording {
    background: var(--color-danger);
    color: white;
    animation: pulse 1s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  .send-btn {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1.25rem;
    min-width: 44px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .send-btn.can-send {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
  
  .send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .sending-indicator {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>