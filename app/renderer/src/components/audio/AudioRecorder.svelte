<script lang="ts">
  /**
   * Reusable Audio Recorder using MediaRecorder API.
   *
   * Props:
   * - variant: 'button' | 'icon' | 'circle'
   * - size: 'sm' | 'md' | 'lg'
   * - constraints: MediaStreamConstraints (default { audio: true })
   * - mimeType: string (defaults to supported opus webm)
   * - audioBitsPerSecond?: number
   * - maxDurationMs?: number
   * - allowReRecord: boolean (default true)
   * - allowDownload: boolean (default true)
   * - showPlaybackControls: boolean (default true)
   * - labels?: mapping of UI labels
   * - class?: string
   *
   * Events:
   * - start
   * - stop(detail: { blob: Blob })
   * - save(detail: { blob: Blob })
   * - cancel
   * - error(detail: { error: Error })
   */
  import { createEventDispatcher, onDestroy } from 'svelte';
  export let variant: 'button' | 'icon' | 'circle' = 'button';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let constraints: MediaStreamConstraints = { audio: true };
  export let mimeType: string | undefined = undefined;
  export let audioBitsPerSecond: number | undefined = undefined;
  export let maxDurationMs: number | undefined = undefined;
  export let allowReRecord: boolean = true;
  export let allowDownload: boolean = true;
  export let showPlaybackControls: boolean = true;
  export let labels: Partial<Record<'start'|'stop'|'save'|'cancel'|'rerecord'|'recording'|'idle', string>> = {};
  export let className: string = '';

  const dispatch = createEventDispatcher();

  type State = 'idle' | 'recording' | 'recorded';
  let state: State = 'idle';
  let mediaStream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let chunks: BlobPart[] = [];
  let recordedBlob: Blob | null = null;
  let audioUrl: string | null = null;
  let stopTimer: number | null = null;

  const defaultLabels = {
    start: 'Record',
    stop: 'Stop',
    save: 'Save',
    cancel: 'Cancel',
    rerecord: 'Re-record',
    recording: 'Recording...',
    idle: 'Idle'
  } as const;
  function L(key: keyof typeof defaultLabels): string { return labels[key] ?? defaultLabels[key]; }

  function getDefaultMime(): string | undefined {
    const preferred = 'audio/webm;codecs=opus';
    if (typeof MediaRecorder !== 'undefined' && (MediaRecorder as any).isTypeSupported?.(preferred)) {
      return preferred;
    }
    return undefined;
  }

  async function startRecording(): Promise<void> {
    if (state === 'recording') return;
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      chunks = [];
      recordedBlob = null;
      if (audioUrl) { URL.revokeObjectURL(audioUrl); audioUrl = null; }
      const options: MediaRecorderOptions = {};
      const type = mimeType ?? getDefaultMime();
      if (type) options.mimeType = type;
      if (audioBitsPerSecond) options.audioBitsPerSecond = audioBitsPerSecond;
      mediaRecorder = new MediaRecorder(mediaStream, options);
      mediaRecorder.ondataavailable = (e: BlobEvent) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = () => {
        try {
          recordedBlob = new Blob(chunks, { type: (options.mimeType as string | undefined) ?? 'audio/webm' });
          audioUrl = URL.createObjectURL(recordedBlob);
          state = 'recorded';
          dispatch('stop', { blob: recordedBlob });
        } catch (err) {
          dispatch('error', { error: err as Error });
        } finally {
          cleanupStream();
          clearMaxTimer();
        }
      };
      mediaRecorder.start();
      state = 'recording';
      dispatch('start');
      if (maxDurationMs && maxDurationMs > 0) {
        stopTimer = window.setTimeout(() => stopRecording(), maxDurationMs);
      }
    } catch (err) {
      dispatch('error', { error: err as Error });
      cleanupStream();
      clearMaxTimer();
    }
  }

  function stopRecording(): void {
    if (mediaRecorder && state === 'recording') {
      mediaRecorder.stop();
    }
  }

  function cancelRecording(): void {
    if (state === 'recording') {
      mediaRecorder?.stop();
    }
    state = 'idle';
    chunks = [];
    recordedBlob = null;
    if (audioUrl) { URL.revokeObjectURL(audioUrl); audioUrl = null; }
    dispatch('cancel');
    cleanupStream();
    clearMaxTimer();
  }

  function reRecord(): void {
    if (!allowReRecord) return;
    state = 'idle';
    chunks = [];
    recordedBlob = null;
    if (audioUrl) { URL.revokeObjectURL(audioUrl); audioUrl = null; }
  }

  function saveRecording(): void {
    if (!recordedBlob) return;
    dispatch('save', { blob: recordedBlob });
    if (allowDownload) {
      const a = document.createElement('a');
      a.href = audioUrl ?? URL.createObjectURL(recordedBlob);
      a.download = `recording-${Date.now()}.webm`;
      a.click();
      if (!audioUrl) URL.revokeObjectURL(a.href);
    }
  }

  function cleanupStream(): void {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      mediaStream = null;
    }
    mediaRecorder = null;
  }

  function clearMaxTimer(): void {
    if (stopTimer) {
      window.clearTimeout(stopTimer);
      stopTimer = null;
    }
  }

  onDestroy(() => {
    cleanupStream();
    clearMaxTimer();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  });

  $: isRecording = state === 'recording';
  $: isRecorded = state === 'recorded';

  function sizeClass(): string {
    return size === 'sm' ? 'gc-size-sm' : size === 'lg' ? 'gc-size-lg' : 'gc-size-md';
  }
  function variantClass(): string {
    if (variant === 'button') return 'btn btn--primary';
    if (variant === 'icon') return 'gc-icon-btn';
    return 'gc-circle-btn';
  }
</script>

<div class={`gc-audio-recorder grid gap-3 ${className}`}>
  {#if state === 'idle'}
    <div class="flex items-center gap-2">
      <button class={`${variantClass()} ${sizeClass()}`} on:click={startRecording} aria-pressed="false" aria-label={L('start')}>
        {#if variant === 'button'}{L('start')}{:else}●{/if}
      </button>
      <span class="text-sm opacity-70">{L('idle')}</span>
    </div>
  {:else if state === 'recording'}
    <div class="flex items-center gap-2">
      <button class={`${variantClass()} ${sizeClass()}`} on:click={stopRecording} aria-pressed="true" aria-label={L('stop')}>
        {#if variant === 'button'}{L('stop')}{:else}■{/if}
      </button>
      <span class="text-sm text-red-600">{L('recording')}</span>
      <button class="btn btn--secondary gc-size-sm" on:click={cancelRecording}>{L('cancel')}</button>
    </div>
  {:else if state === 'recorded'}
    <div class="grid gap-2">
      {#if showPlaybackControls}
        <audio controls src={audioUrl ?? ''} class="w-full"></audio>
      {/if}
      <div class="flex items-center gap-2">
        <button class="btn btn--primary" on:click={saveRecording}>{L('save')}</button>
        {#if allowReRecord}
          <button class="btn btn--secondary" on:click={reRecord}>{L('rerecord')}</button>
        {/if}
        <button class="btn" on:click={() => { if (allowReRecord) reRecord(); else cancelRecording(); }}>
          {allowReRecord ? L('cancel') : L('cancel')}
        </button>
      </div>
    </div>
  {/if}
</div>



