<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { t } from '@ts/i18n';

  interface Props {
    audioUrl?: string;
    autoPlay?: boolean;
    onEnded?: () => void;
    showDownload?: boolean;
    showProgress?: boolean;
  }

  let { 
    audioUrl,
    autoPlay = false,
    onEnded,
    showDownload = true,
    showProgress = true
  }: Props = $props();

  let audioElement: HTMLAudioElement | undefined = $state();
  let isPlaying = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);
  let volume = $state(1);

  $effect(() => {
    if (audioElement && audioUrl) {
      audioElement.src = audioUrl;
      if (autoPlay) {
        play();
      }
    }
  });

  function play() {
    if (audioElement) {
      audioElement.play();
      isPlaying = true;
    }
  }

  function pause() {
    if (audioElement) {
      audioElement.pause();
      isPlaying = false;
    }
  }

  function togglePlayPause() {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }

  function handleTimeUpdate() {
    if (audioElement) {
      currentTime = audioElement.currentTime;
    }
  }

  function handleLoadedMetadata() {
    if (audioElement) {
      duration = audioElement.duration;
    }
  }

  function handleEnded() {
    isPlaying = false;
    onEnded?.();
  }

  function handleSeek(event: Event) {
    const target = event.target as HTMLInputElement;
    if (audioElement) {
      audioElement.currentTime = parseFloat(target.value);
    }
  }

  function handleVolumeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    volume = parseFloat(target.value);
    if (audioElement) {
      audioElement.volume = volume;
    }
  }

  function formatTime(seconds: number): string {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function download() {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `tts-audio-${Date.now()}.mp3`;
      a.click();
    }
  }

  onDestroy(() => {
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
  });
</script>

<div class="tts-player">
  {#if audioUrl}
    <audio
      bind:this={audioElement}
      ontimeupdate={handleTimeUpdate}
      onloadedmetadata={handleLoadedMetadata}
      onended={handleEnded}
      preload="metadata"
    />

    <div class="player-controls">
      <button 
        onclick={togglePlayPause}
        class="btn btn-primary play-button"
        aria-label={isPlaying ? $t('tts.pause') : $t('tts.play')}
      >
        {#if isPlaying}
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        {:else}
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        {/if}
      </button>

      {#if showProgress}
        <div class="progress-container">
          <span class="time">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            oninput={handleSeek}
            class="progress-bar"
            disabled={!duration}
          />
          <span class="time">{formatTime(duration)}</span>
        </div>
      {/if}

      <div class="volume-container">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          {#if volume > 0}
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          {/if}
        </svg>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          oninput={handleVolumeChange}
          class="volume-slider"
        />
      </div>

      {#if showDownload}
        <button 
          onclick={download}
          class="btn btn-secondary download-button"
          aria-label={$t('tts.download')}
        >
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>
      {/if}
    </div>
  {:else}
    <div class="no-audio">
      <p>{$t('tts.no_audio')}</p>
    </div>
  {/if}
</div>