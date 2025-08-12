<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy } from 'svelte';

  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());

  let valueText = '';
  let valueDisabled = '';
  let valueInvalid = '';
  let valueSelect = '';
  let valueMulti: string[] = [];
  let valueArea = '';
</script>

<section class="container-page stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.styleguide.inputs.title')}</h2>
  <p class="opacity-80">{t('pages.styleguide.inputs.desc')}</p>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Text input -->
    <label class="field">
      <span class="field__label">{t('pages.styleguide.inputs.text')}</span>
      <input class="input" bind:value={valueText} placeholder={t('pages.styleguide.inputs.placeholder')} />
      <span class="field__hint">{t('pages.styleguide.inputs.hint')}</span>
    </label>

    <!-- Disabled input -->
    <label class="field">
      <span class="field__label">{t('pages.styleguide.inputs.disabled')}</span>
      <input class="input" bind:value={valueDisabled} placeholder={t('pages.styleguide.inputs.placeholder')} disabled />
      <span class="field__hint">{t('pages.styleguide.inputs.disabledHint')}</span>
    </label>

    <!-- Invalid input -->
    <label class="field field--invalid">
      <span class="field__label">{t('pages.styleguide.inputs.invalid')}</span>
      <input class="input" bind:value={valueInvalid} placeholder={t('pages.styleguide.inputs.placeholder')} />
      <span class="field__hint">{t('pages.styleguide.inputs.error')}</span>
    </label>

    <!-- Select -->
    <label class="field">
      <span class="field__label">{t('pages.styleguide.inputs.select')}</span>
      <select class="input" bind:value={valueSelect}>
        <option value="">{t('pages.styleguide.inputs.choose')}</option>
        <option value="a">A</option>
        <option value="b">B</option>
        <option value="c">C</option>
      </select>
    </label>

    <!-- Multi select -->
    <label class="field">
      <span class="field__label">{t('pages.styleguide.inputs.multi')}</span>
      <select class="input" multiple bind:value={valueMulti} size="4">
        <option value="a">A</option>
        <option value="b">B</option>
        <option value="c">C</option>
        <option value="d">D</option>
      </select>
      <span class="field__hint">{t('pages.styleguide.inputs.multiHint')}</span>
    </label>

    <!-- Text area -->
    <label class="field md:col-span-2">
      <span class="field__label">{t('pages.styleguide.inputs.textarea')}</span>
      <textarea class="input" rows="4" bind:value={valueArea} placeholder={t('pages.styleguide.inputs.placeholder')}></textarea>
      <span class="field__hint">{t('pages.styleguide.inputs.textareaHint')}</span>
    </label>
  </div>
</section>


