<script lang="ts">
  import Modal from '@components/Modal.svelte';
  let showModal = false;
  import { t as tStore } from '@features/i18n/store';
  $: t = $tStore;
</script>

<section class="container-page stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.styleguide.title')}</h2>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="stack-md">
      <h3 class="text-lg font-semibold">{t('pages.styleguide.buttons')}</h3>
      <div class="flex flex-wrap gap-2">
        <button class="btn btn--primary">{t('pages.styleguide.primary')}</button>
        <button class="btn btn--secondary">{t('pages.styleguide.secondary')}</button>
        <button class="btn btn--link">{t('pages.styleguide.link')}</button>
      </div>
    </div>

    <div class="stack-md">
      <h3 class="text-lg font-semibold">{t('pages.styleguide.inputs')}</h3>
      <div class="grid gap-3">
        <label class="field">
          <span class="field__label">{t('pages.styleguide.text')}</span>
          <input class="input" placeholder={t('pages.styleguide.placeholder')} />
          <span class="field__hint">{t('pages.styleguide.hint')}</span>
        </label>
        <label class="field field--invalid">
          <span class="field__label">{t('pages.styleguide.invalid')}</span>
          <input class="input" placeholder={t('pages.styleguide.invalidPlaceholder')} />
          <span class="field__hint">{t('pages.styleguide.error')}</span>
        </label>
      </div>
    </div>

    <div class="stack-md">
      <h3 class="text-lg font-semibold">{t('pages.styleguide.typography')}</h3>
      <p>{t('pages.styleguide.body')}</p>
      <a href="#/test/styleguide" class="btn btn--link">{t('pages.styleguide.link')}</a>
      <ul class="list-disc pl-5">
        <li>{t('pages.styleguide.stackA')}</li>
        <li>{t('pages.styleguide.stackB')}</li>
      </ul>
    </div>

    <div class="stack-md">
      <h3 class="text-lg font-semibold">{t('pages.styleguide.modal')}</h3>
      <button class="btn btn--primary" on:click={() => (showModal = true)}>{t('pages.styleguide.openModal')}</button>
    </div>
  </div>

  <div class="stack-md">
    <h3 class="text-lg font-semibold">{t('pages.styleguide.layout')}</h3>
    <div class="container-page demo-box">{t('pages.styleguide.containerDemo')}</div>
    <div class="stack-md demo-box">
      <div>{t('pages.styleguide.stackA')}</div>
      <div>{t('pages.styleguide.stackB')}</div>
      <div>{t('pages.styleguide.stackC')}</div>
    </div>
  </div>

  <Modal open={showModal} onClose={() => (showModal = false)} title={t('pages.styleguide.modalTitle')}>
    <p>{t('pages.styleguide.modalContent')}</p>
  </Modal>
</section>



