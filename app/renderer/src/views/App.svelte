<script lang="ts">
  import HeaderComponent from '@components/Header.svelte';
  import FooterComponent from '@components/Footer.svelte';
  import SidebarComponent from '@components/Sidebar.svelte';
  import ModalComponent from '@components/Modal.svelte';
  import StyleguideView from '@views/StyleguideView.svelte';
  import StyleguideTableView from '@views/StyleguideTableView.svelte';
  import StyleguideInputsView from '@views/StyleguideInputsView.svelte';
  import StyleguideButtonsView from '@views/StyleguideButtonsView.svelte';
  import HomeView from '@views/HomeView.svelte';
  import AboutView from '@views/AboutView.svelte';
  import CategoryItem1View from '@views/CategoryItem1View.svelte';
  import CategoryItem2View from '@views/CategoryItem2View.svelte';
  import SettingsConfigView from '@views/SettingsConfigView.svelte';
  import Test1View from '@views/Test1View.svelte';
  import TestDbTableView from '@views/TestDbTableView.svelte';
  import { onMount, onDestroy } from 'svelte';
  import StyleguideComponentsView from '@views/StyleguideComponentsView.svelte';
  import { sidebarOpen, modalOpen } from '@features/ui/store';
  import { initTheme, toggleSidebar, closeSidebar, closeModal } from '@features/ui/service';
  import { currentRoute } from '@features/router/store';
  import type { Route } from '@features/router/types';
  import { initRouter, disposeRouter } from '@features/router/service';
  import { activeRoute } from '@features/navigation/store';
  import { initSettings } from '@features/settings/service';
  import { initI18n } from '@ts/i18n/service';
  import { t as tStore } from '@ts/i18n/store';
  import { themeModeStore } from '@features/settings/store';
  import { setThemeMode } from '@features/settings/service';

  let route: Route = 'home';
  let currentTheme: 'light' | 'dark' | 'fun' = 'light';
  let isSidebarOpen: boolean = false;
  let isModalOpen: boolean = false;
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));

  const unsubTheme = themeModeStore.subscribe((v) => (currentTheme = v));
  // DOM updates handled in initTheme
  const unsubSidebar = sidebarOpen.subscribe((v) => (isSidebarOpen = v));
  const unsubModal = modalOpen.subscribe((v) => (isModalOpen = v));
  const unsubRoute = currentRoute.subscribe((r) => {
    route = r;
    activeRoute.set(r);
  });
  onMount(() => {
    const cleanupTheme = initTheme();
    initSettings().then((s) => initI18n(s.locale));
    initRouter();
    return () => {
      cleanupTheme?.();
    };
  });

  onDestroy(() => {
    unsubT();
    unsubTheme();
    unsubSidebar();
    unsubModal();
    unsubRoute();
    disposeRouter();
  });

  function navigateTheme(): void {
    const next = currentTheme === 'light' ? 'dark' : currentTheme === 'dark' ? 'fun' : 'light';
    setThemeMode(next);
  }
</script>

<HeaderComponent onToggleTheme={navigateTheme} onToggleSidebar={toggleSidebar} theme={currentTheme} />

<SidebarComponent open={isSidebarOpen} onClose={closeSidebar} />

<main class="container-page stack-lg py-6">
  {#if route === 'home'}
    <HomeView />
  {:else if route === 'category.item1'}
    <CategoryItem1View />
  {:else if route === 'category.item2'}
    <CategoryItem2View />
  {:else if route === 'settings.config'}
    <SettingsConfigView />
  {:else if route === 'settings.about'}
    <AboutView />
  {:else if route === 'test.styleguide'}
    <StyleguideView />
  {:else if route === 'test.styleguide.base'}
    <StyleguideView />
  {:else if route === 'test.styleguide.inputs'}
    <StyleguideInputsView />
  {:else if route === 'test.styleguide.buttons'}
    <StyleguideButtonsView />
  {:else if route === 'test.styleguide.table'}
    <StyleguideTableView />
  {:else if route === 'test.styleguide.components'}
    <StyleguideComponentsView />
  {:else if route === 'test.test1'}
    <Test1View />
  {:else if route === 'test.db.test-table'}
    <TestDbTableView />
  {/if}
</main>

<ModalComponent open={isModalOpen} onClose={closeModal} title="pages.styleguide.modalTitle">
  <p>{t('pages.styleguide.modalContent')}</p>
 </ModalComponent>

<FooterComponent />

 


