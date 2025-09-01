<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import AudioRecorder from '@components/audio/AudioRecorder.svelte';
  import type { STTOptions } from '@features/stt';
  import { sttStore } from '@features/stt';
  import { t } from '@ts/i18n';

  interface Props {
    options?: STTOptions;
    onTranscription?: (text: string) => void;
    autoTranscribe?: boolean;
    maxDuration?: number;
  }

  let {
    options = { model: 'whisper-1', language: 'auto' } as STTOptions,
    onTranscription,
    autoTranscribe = true,
    maxDuration = 300
  }: Props = $props();

  let isTranscribing = $state(false);
  let lastRecording: Blob | undefined = $state();

  async function handleRecordingComplete(event: CustomEvent<{ blob: Blob }>) {
    lastRecording = event.detail.blob;
    
    if (autoTranscribe) {
      await transcribe();
    }
  }

  async function transcribe() {
    if (!lastRecording) return;

    isTranscribing = true;
    try {
      const response = await sttStore.transcribeFromRecording(lastRecording, options);
      if (response.text) {
        onTranscription?.(response.text);
      }
    } catch (error) {
      console.error('Transcription error:', error);
    } finally {
      isTranscribing = false;
    }
  }

  function handleRecordingStart() {
    sttStore.setRecording(true);
  }

  function handleRecordingStop() {
    sttStore.setRecording(false);
  }
</script>

<div class="stt-recorder">
  <AudioRecorder
    variant="circle"
    {maxDuration}
    on:recordingComplete={handleRecordingComplete}
    on:recordingStart={handleRecordingStart}
    on:recordingStop={handleRecordingStop}
  />

  {#if isTranscribing}
    <div class="transcribing-indicator">
      <div class="spinner"></div>
      <span>{$t('stt.transcribing')}</span>
    </div>
  {/if}

  {#if lastRecording && !autoTranscribe && !isTranscribing}
    <button
      onclick={transcribe}
      class="btn btn-primary transcribe-button"
      disabled={isTranscribing}
    >
      {$t('stt.transcribe')}
    </button>
  {/if}
</div>