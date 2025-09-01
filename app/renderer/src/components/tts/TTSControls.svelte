<script lang="ts">
  import type { TTSVoice, TTSModel, TTSFormat, TTSOptions } from '@features/tts';
  import { TTS_VOICES, TTS_MODELS, TTS_FORMATS } from '@features/tts';
  import { t } from '@ts/i18n';

  interface Props {
    options?: TTSOptions;
    onOptionsChange?: (options: TTSOptions) => void;
    disabled?: boolean;
  }

  let { 
    options = $bindable({
      voice: 'alloy',
      model: 'tts-1',
      format: 'mp3',
      speed: 1.0
    } as TTSOptions),
    onOptionsChange,
    disabled = false
  }: Props = $props();

  function handleVoiceChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    options = { ...options, voice: target.value as TTSVoice };
    onOptionsChange?.(options);
  }

  function handleModelChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    options = { ...options, model: target.value as TTSModel };
    onOptionsChange?.(options);
  }

  function handleFormatChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    options = { ...options, format: target.value as TTSFormat };
    onOptionsChange?.(options);
  }

  function handleSpeedChange(event: Event) {
    const target = event.target as HTMLInputElement;
    options = { ...options, speed: parseFloat(target.value) };
    onOptionsChange?.(options);
  }
</script>

<div class="tts-controls">
  <div class="control-group">
    <label for="tts-voice">
      {$t('tts.voice')}
    </label>
    <select 
      id="tts-voice" 
      value={options.voice}
      onchange={handleVoiceChange}
      {disabled}
      class="select"
    >
      {#each Object.entries(TTS_VOICES) as [value, label]}
        <option {value}>{label}</option>
      {/each}
    </select>
  </div>

  <div class="control-group">
    <label for="tts-model">
      {$t('tts.model')}
    </label>
    <select 
      id="tts-model" 
      value={options.model}
      onchange={handleModelChange}
      {disabled}
      class="select"
    >
      {#each Object.entries(TTS_MODELS) as [value, label]}
        <option {value}>{label}</option>
      {/each}
    </select>
  </div>

  <div class="control-group">
    <label for="tts-format">
      {$t('tts.format')}
    </label>
    <select 
      id="tts-format" 
      value={options.format}
      onchange={handleFormatChange}
      {disabled}
      class="select"
    >
      {#each Object.entries(TTS_FORMATS) as [value, label]}
        <option {value}>{label}</option>
      {/each}
    </select>
  </div>

  <div class="control-group">
    <label for="tts-speed">
      {$t('tts.speed')}: {options.speed}x
    </label>
    <input 
      id="tts-speed"
      type="range"
      min="0.25"
      max="4.0"
      step="0.25"
      value={options.speed}
      oninput={handleSpeedChange}
      {disabled}
      class="range"
    />
  </div>
</div>