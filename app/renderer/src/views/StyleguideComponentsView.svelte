<script lang="ts">
  import Drawer from '@components/Drawer.svelte';
  import Modal from '@components/Modal.svelte';
  import Header from '@components/Header.svelte';
  import Footer from '@components/Footer.svelte';
  import Sidebar from '@components/Sidebar.svelte';
  import NavTree from '@components/NavTree.svelte';
  import ProgressBar from '@components/ProgressBar.svelte';
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy } from 'svelte';
  import { openModal, closeModal } from '@features/ui/service';
  import { modalOpen } from '@features/ui/store';
  import { menuItems } from '@features/navigation/store';

  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());

  let isModalOpen = false;
  const unsubModal = modalOpen.subscribe((v) => (isModalOpen = v));
  onDestroy(() => { unsubModal(); });

  let demoDrawerOpen: boolean = false;
  function openDemoDrawer(): void { demoDrawerOpen = true; }
  function closeDemoDrawer(): void { demoDrawerOpen = false; }

  let demoMenu: any[] = [];
  const unsubMenu = menuItems.subscribe((v) => (demoMenu = v));
  onDestroy(() => { unsubMenu(); });

  // Progress demo state
  let progressValue: number = 0;
  function bumpProgress(): void {
    progressValue = Math.min(100, progressValue + 10);
  }
  function resetProgress(): void {
    progressValue = 0;
  }
</script>

<section class="container-page stack-lg px-4 md:px-6 py-4 md:py-6">
  <h2 class="text-2xl font-bold">{t('pages.styleguide.components.title')}</h2>
  <p class="opacity-80 mb-4 md:mb-6">{t('pages.styleguide.components.desc')}</p>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    <div class="stack-md">
      <h3 class="text-lg font-semibold">{t('pages.styleguide.components.sidebar.title')}</h3>
      <button class="btn btn--primary" on:click={openDemoDrawer}>{t('pages.styleguide.components.sidebar.open')}</button>
    </div>

    <div class="stack-md">
      <h3 class="text-lg font-semibold">{t('pages.styleguide.components.modal.title')}</h3>
      <button class="btn btn--secondary" on:click={openModal}>{t('pages.styleguide.components.modal.open')}</button>
      <Modal open={isModalOpen} onClose={closeModal} title={t('pages.styleguide.components.modal.title')}>
        <p>{t('pages.styleguide.components.modal.content')}</p>
      </Modal>
    </div>

    <div class="stack-md">
      <h3 class="text-lg font-semibold">Header</h3>
      <div class="demo-box p-4 md:p-6 my-6">
        <Header onToggleTheme={() => {}} onToggleSidebar={() => {}} theme="light" title="app.title" />
      </div>
    </div>

    <div class="stack-md">
      <h3 class="text-lg font-semibold">Footer</h3>
      <div class="demo-box p-4 md:p-6 my-6">
        <Footer />
      </div>
    </div>

    <div class="stack-md">
      <h3 class="text-lg font-semibold">NavTree</h3>
      <div class="demo-box p-4 md:p-6 my-6">
        <NavTree items={demoMenu} onNavigate={() => {}} />
      </div>
    </div>

    <div class="stack-md">
      <h3 class="text-lg font-semibold">{t('pages.styleguide.components.progress.title')}</h3>
      <div class="demo-box p-4 md:p-6 my-6 stack-sm">
        <ProgressBar value={progressValue} max={100} size="xl" color="accent" striped animated testId="progress-main" />
        <div class="flex items-center gap-8 my-6">
          <button class="btn btn--primary btn--sm" on:click={bumpProgress}>{t('pages.styleguide.components.progress.bump')}</button>
          <button class="btn btn--secondary btn--sm" on:click={resetProgress}>{t('pages.styleguide.components.progress.reset')}</button>
        </div>
        <div class="grid grid-cols-3 gap-3 my-6">
          <ProgressBar value={25} size="sm" color="primary" />
          <ProgressBar value={50} size="md" color="success" striped />
          <ProgressBar value={75} size="lg" color="warning" />
        </div>
        <div class="stack-sm">
          <div class="opacity-80 text-sm">{t('pages.styleguide.components.progress.indeterminate')}</div>
          <ProgressBar indeterminate size="md" color="accent" animated />
        </div>
      </div>
    </div>
  </div>

  <Drawer open={demoDrawerOpen} onClose={closeDemoDrawer} title={t('pages.styleguide.components.sidebar.title')}>
    <p class="text-sm opacity-80">{t('pages.styleguide.components.desc')}</p>
    <div slot="footer" class="flex justify-end">
      <button class="btn btn--secondary" on:click={closeDemoDrawer}>{t('app.menu.close')}</button>
    </div>
  </Drawer>
</section>


