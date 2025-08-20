<script lang="ts">
  import HeaderComponent from '@components/Header.svelte';
  import FooterComponent from '@components/Footer.svelte';
  import SidebarComponent from '@components/Sidebar.svelte';
  import ModalComponent from '@components/Modal.svelte';
  import StyleguideOverviewView from '@views-development/styleguide/StyleguideOverviewView.svelte';
  import StyleguideBaseView from '@views-development/styleguide/StyleguideBaseView.svelte';
  import StyleguideTableView from '@views-development/styleguide/StyleguideTableView.svelte';
  import StyleguideInputsView from '@views-development/styleguide/StyleguideInputsView.svelte';
  import StyleguideButtonsView from '@views-development/styleguide/StyleguideButtonsView.svelte';
  import HomeView from '@views/HomeView.svelte';
  import AboutView from '@views-settings/AboutView.svelte';
  
  import SettingsConfigView from '@views-settings/SettingsConfigView.svelte';
  
  import TestDbTableView from '@views-development/db/TestDbTableView.svelte';
  import { onMount, onDestroy } from 'svelte';
  import StyleguideComponentsView from '@views-development/styleguide/StyleguideComponentsView.svelte';
  import StyleguideSearchView from '@views-development/styleguide/StyleguideSearchView.svelte';
  import StyleguideMediaView from '@views-development/styleguide/StyleguideMediaView.svelte';
  import StyleguideFilesView from '@views-development/styleguide/StyleguideFilesView.svelte';
  import StyleguideChatbotView from '@views-development/styleguide/StyleguideChatbotView.svelte';
  import StyleguideRecordView from '@views-development/styleguide/StyleguideRecordView.svelte';
  import FeaturesOverviewView from '@views-development/features/FeaturesOverviewView.svelte';
  import FeatureLocalFilesView from '@views-development/features/FeatureLocalFilesView.svelte';
  import FeatureSavedLocalFolderView from '@views-development/features/FeatureDefaultFolderView.svelte';
  import FeatureCaptureScreenView from '@views-development/features/FeatureCaptureScreenView.svelte';
  import AdminProviderView from '@views-admin/entity/llm/AdminProviderView.svelte';
  import AdminModelView from '@views-admin/entity/llm/AdminModelView.svelte';
  import AdminAgentView from '@views-admin/entity/llm/AdminAgentView.svelte';
  import TestAICommunicationView from '@views-development/ai/TestAICommunicationView.svelte';
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
  import { isRouteAvailable } from '@features/config/store';
  import { initConfig } from '@features/config/service';

  let route: Route = 'home';
  let currentTheme: 'light' | 'dark' | 'fun' = 'light';
  let isSidebarOpen: boolean = false;
  let isModalOpen: boolean = false;
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  let canShowRoute: (route: Route) => boolean = () => false;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  const unsubRouteAvailable = isRouteAvailable.subscribe((fn) => (canShowRoute = fn));

  const unsubTheme = themeModeStore.subscribe((v) => (currentTheme = v));
  // DOM updates handled in initTheme
  const unsubSidebar = sidebarOpen.subscribe((v) => (isSidebarOpen = v));
  const unsubModal = modalOpen.subscribe((v) => (isModalOpen = v));
  const unsubRoute = currentRoute.subscribe((r) => {
    route = r;
    activeRoute.set(r);
  });
  onMount(async () => {
    const cleanupTheme = initTheme();
    await initConfig();
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
    unsubRouteAvailable();
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
  {:else if canShowRoute(route) && route === 'development.styleguide'}
    <StyleguideOverviewView />
  {:else if canShowRoute(route) && route === 'development.styleguide.base'}
    <StyleguideBaseView />
  {:else if canShowRoute(route) && route === 'development.styleguide.inputs'}
    <StyleguideInputsView />
  {:else if canShowRoute(route) && route === 'development.styleguide.buttons'}
    <StyleguideButtonsView />
  {:else if canShowRoute(route) && route === 'development.styleguide.table'}
    <StyleguideTableView />
  {:else if canShowRoute(route) && route === 'development.styleguide.components'}
    <StyleguideComponentsView />
  {:else if canShowRoute(route) && route === 'development.styleguide.search'}
    <StyleguideSearchView />
  {:else if canShowRoute(route) && route === 'development.styleguide.media'}
    <StyleguideMediaView />
  {:else if canShowRoute(route) && route === 'development.styleguide.files'}
    <StyleguideFilesView />
  {:else if canShowRoute(route) && route === 'development.styleguide.chatbot'}
    <StyleguideChatbotView />
  {:else if canShowRoute(route) && route === 'development.styleguide.record'}
    <StyleguideRecordView />
  {:else if canShowRoute(route) && route === 'development.features'}
    <FeaturesOverviewView />
  {:else if canShowRoute(route) && route === 'development.features.local-files'}
    <FeatureLocalFilesView />
  {:else if canShowRoute(route) && route === 'development.features.saved-local-folder'}
    <FeatureSavedLocalFolderView />
  {:else if canShowRoute(route) && route === 'development.features.capture-screen'}
    <FeatureCaptureScreenView />
  
  {:else if canShowRoute(route) && route === 'development.db.test-table'}
    <TestDbTableView />
  {:else if canShowRoute(route) && route === 'admin.entity.provider'}
    <AdminProviderView />
  {:else if canShowRoute(route) && route === 'admin.entity.model'}
    <AdminModelView />
  {:else if canShowRoute(route) && route === 'admin.entity.agent'}
    <AdminAgentView />
  {:else if canShowRoute(route) && route === 'development.ai.communication'}
    <TestAICommunicationView />
  {/if}
</main>

<ModalComponent open={isModalOpen} onClose={closeModal} title="pages.styleguide.modalTitle">
  <p>{t('pages.styleguide.modalContent')}</p>
 </ModalComponent>

<FooterComponent />

 


