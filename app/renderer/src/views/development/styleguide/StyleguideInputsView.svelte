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
  let valueCheckbox: boolean = false;
  let valueRadio: string = 'a';
  let valueSwitch: boolean = false;
  let valueNumber: number | '' = '';
  let valueRange: number = 50;
  let valueDate: string = '';
  let valueTime: string = '';
  let valueFileName: string = '';
</script>

<section class="stack-lg">
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

    <!-- Checkbox -->
    <label class="control">
      <input type="checkbox" bind:checked={valueCheckbox} />
      <span>{t('pages.styleguide.inputs.checkbox')}</span>
    </label>

    <!-- Radio group -->
    <div class="grid gap-2">
      <span class="field__label">{t('pages.styleguide.inputs.radioGroup')}</span>
      <label class="control">
        <input type="radio" name="demoRadio" bind:group={valueRadio} value="a" />
        <span>{t('pages.styleguide.inputs.radioA')}</span>
      </label>
      <label class="control">
        <input type="radio" name="demoRadio" bind:group={valueRadio} value="b" />
        <span>{t('pages.styleguide.inputs.radioB')}</span>
      </label>
    </div>

    <!-- Switch / Toggle -->
    <div class="grid gap-2">
      <span class="field__label">{t('pages.styleguide.inputs.switch')}</span>
      <label class="switch">
        <input class="switch__input sr-only" type="checkbox" role="switch" aria-checked={valueSwitch} bind:checked={valueSwitch} />
        <span class="switch__track" aria-hidden="true"><span class="switch__thumb"></span></span>
        <span>{valueSwitch ? t('pages.styleguide.inputs.on') : t('pages.styleguide.inputs.off')}</span>
      </label>
    </div>

    <!-- Number -->
    <label class="field">
      <span class="field__label">{t('pages.styleguide.inputs.number')}</span>
      <input class="input" type="number" bind:value={valueNumber} placeholder={t('pages.styleguide.inputs.placeholder')} />
    </label>

    <!-- Range -->
    <div class="grid gap-2">
      <span class="field__label">{t('pages.styleguide.inputs.range')}</span>
      <input type="range" min="0" max="100" bind:value={valueRange} />
      <span class="field__hint">{valueRange}</span>
    </div>

    <!-- Date -->
    <label class="field">
      <span class="field__label">{t('pages.styleguide.inputs.date')}</span>
      <input class="input" type="date" bind:value={valueDate} />
    </label>

    <!-- Time -->
    <label class="field">
      <span class="field__label">{t('pages.styleguide.inputs.time')}</span>
      <input class="input" type="time" bind:value={valueTime} />
    </label>

    <!-- File -->
    <div class="grid gap-2 md:col-span-2">
      <span class="field__label">{t('pages.styleguide.inputs.file')}</span>
      <input type="file" on:change={(e) => { const f = (e.currentTarget as HTMLInputElement).files?.[0]; valueFileName = f ? f.name : ''; }} />
      <span class="field__hint">{valueFileName ? t('pages.styleguide.inputs.selectedFile', { name: valueFileName }) : t('pages.styleguide.inputs.chooseFile')}</span>
    </div>
  </div>
</section>


