<script lang="ts">
  import HeaderComponent from '@components/Header.svelte';
  import FooterComponent from '@components/Footer.svelte';
  import SidebarComponent from '@components/Sidebar.svelte';
  import ModalComponent from '@components/Modal.svelte';
  import StyleguideOverviewView from '@views/StyleguideOverviewView.svelte';
  import StyleguideBaseView from '@views/StyleguideBaseView.svelte';
  import StyleguideTableView from '@views/StyleguideTableView.svelte';
  import StyleguideInputsView from '@views/StyleguideInputsView.svelte';
  import StyleguideButtonsView from '@views/StyleguideButtonsView.svelte';
  import HomeView from '@views/HomeView.svelte';
  import AboutView from '@views/AboutView.svelte';
  
  import SettingsConfigView from '@views/SettingsConfigView.svelte';
  
  import TestDbTableView from '@views/TestDbTableView.svelte';
  import { onMount, onDestroy } from 'svelte';
  import StyleguideComponentsView from '@views/StyleguideComponentsView.svelte';
  import StyleguideSearchView from '@views/StyleguideSearchView.svelte';
  import StyleguideMediaView from '@views/StyleguideMediaView.svelte';
  import StyleguideFilesView from '@views/StyleguideFilesView.svelte';
  import StyleguideChatbotView from '@views/StyleguideChatbotView.svelte';
  import StyleguideRecordView from '@views/StyleguideRecordView.svelte';
  import FeaturesOverviewView from '@views/FeaturesOverviewView.svelte';
  import FeatureLocalFilesView from '@views/FeatureLocalFilesView.svelte';
  import FeatureSavedLocalFolderView from '@views/FeatureDefaultFolderView.svelte';
  import AdminProviderView from '@views/AdminProviderView.svelte';
  import AdminModelView from '@views/AdminModelView.svelte';
  import AdminAgentView from '@views/AdminAgentView.svelte';
  import TestAICommunicationView from '@views/TestAICommunicationView.svelte';
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
  
  {:else if route === 'settings.config'}
    <SettingsConfigView />
  {:else if route === 'settings.about'}
    <AboutView />
  {:else if import.meta.env.DEV && route === 'development.styleguide'}
    <StyleguideOverviewView />
  {:else if import.meta.env.DEV && route === 'development.styleguide.base'}
    <StyleguideBaseView />
  {:else if import.meta.env.DEV && route === 'development.styleguide.inputs'}
    <StyleguideInputsView />
  {:else if import.meta.env.DEV && route === 'development.styleguide.buttons'}
    <StyleguideButtonsView />
  {:else if import.meta.env.DEV && route === 'development.styleguide.table'}
    <StyleguideTableView />
  {:else if import.meta.env.DEV && route === 'development.styleguide.components'}
    <StyleguideComponentsView />
  {:else if import.meta.env.DEV && route === 'development.styleguide.search'}
    <StyleguideSearchView />
  {:else if import.meta.env.DEV && route === 'development.styleguide.media'}
    <StyleguideMediaView />
  {:else if import.meta.env.DEV && route === 'development.styleguide.files'}
    <StyleguideFilesView />
  {:else if import.meta.env.DEV && route === 'development.styleguide.chatbot'}
    <StyleguideChatbotView />
  {:else if import.meta.env.DEV && route === 'development.styleguide.record'}
    <StyleguideRecordView />
  {:else if import.meta.env.DEV && route === 'development.features'}
    <FeaturesOverviewView />
  {:else if import.meta.env.DEV && route === 'development.features.local-files'}
    <FeatureLocalFilesView />
  {:else if import.meta.env.DEV && route === 'development.features.saved-local-folder'}
    <FeatureSavedLocalFolderView />
  
  {:else if route === 'development.db.test-table'}
    <TestDbTableView />
  {:else if import.meta.env.DEV && route === 'admin.entity.provider'}
    <AdminProviderView />
  {:else if import.meta.env.DEV && route === 'admin.entity.model'}
    <AdminModelView />
  {:else if import.meta.env.DEV && route === 'admin.entity.agent'}
    <AdminAgentView />
  {:else if import.meta.env.DEV && route === 'development.ai.communication'}
    <TestAICommunicationView />
  {/if}
</main>

<ModalComponent open={isModalOpen} onClose={closeModal} title="pages.styleguide.modalTitle">
  <p>{t('pages.styleguide.modalContent')}</p>
 </ModalComponent>

<FooterComponent />

 


