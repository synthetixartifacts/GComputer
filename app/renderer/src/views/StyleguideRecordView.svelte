<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy } from 'svelte';
  import AudioRecorder from '@components/audio/AudioRecorder.svelte';
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());

  function saveHandler(kind: string) {
    return (e: CustomEvent<{ blob: Blob }>) => {
      // placeholder hook for demo; default download is handled by component if allowDownload=true
      console.log(`[${kind}] save received`, e.detail.blob);
    };
  }
</script>

<section class="container-page stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.styleguide.record.title')}</h2>
  <p class="opacity-80">{t('pages.styleguide.record.desc')}</p>

  <div class="grid gap-8">
    <section class="grid gap-3">
      <h3 class="text-lg font-semibold">Button Recorder</h3>
      <AudioRecorder
        variant="button"
        size="md"
        allowReRecord={true}
        allowDownload={true}
        showPlaybackControls={true}
        labels={{
          start: t('pages.styleguide.record.labels.start'),
          stop: t('pages.styleguide.record.labels.stop'),
          save: t('pages.styleguide.record.labels.save'),
          cancel: t('pages.styleguide.record.labels.cancel'),
          rerecord: t('pages.styleguide.record.labels.rerecord'),
          recording: t('pages.styleguide.record.labels.recording'),
          idle: t('pages.styleguide.record.labels.idle'),
        }}
        on:save={saveHandler('button')}
      />
    </section>

    <section class="grid gap-3">
      <h3 class="text-lg font-semibold">Big Circular Icon</h3>
      <AudioRecorder
        variant="circle"
        size="lg"
        maxDurationMs={60000}
        allowReRecord={true}
        allowDownload={true}
        showPlaybackControls={true}
        labels={{
          start: t('pages.styleguide.record.labels.start'),
          stop: t('pages.styleguide.record.labels.stop'),
          save: t('pages.styleguide.record.labels.save'),
          cancel: t('pages.styleguide.record.labels.cancel'),
          rerecord: t('pages.styleguide.record.labels.rerecord'),
          recording: t('pages.styleguide.record.labels.recording'),
          idle: t('pages.styleguide.record.labels.idle'),
        }}
        on:save={saveHandler('circle')}
      />
    </section>

    <section class="grid gap-3">
      <h3 class="text-lg font-semibold">Icon-only</h3>
      <AudioRecorder
        variant="icon"
        size="sm"
        allowReRecord={true}
        allowDownload={true}
        showPlaybackControls={true}
        labels={{
          start: t('pages.styleguide.record.labels.start'),
          stop: t('pages.styleguide.record.labels.stop'),
          save: t('pages.styleguide.record.labels.save'),
          cancel: t('pages.styleguide.record.labels.cancel'),
          rerecord: t('pages.styleguide.record.labels.rerecord'),
          recording: t('pages.styleguide.record.labels.recording'),
          idle: t('pages.styleguide.record.labels.idle'),
        }}
        on:save={saveHandler('icon')}
      />
    </section>
  </div>
</section>


