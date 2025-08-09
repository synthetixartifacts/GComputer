<script lang="ts">
  import HeaderComponent from '@components/Header.svelte';
  import FooterComponent from '@components/Footer.svelte';
  import SidebarComponent from '@components/Sidebar.svelte';
  import ModalComponent from '@components/Modal.svelte';
  import StyleguideView from '@views/StyleguideView.svelte';
  import HomeView from '@views/HomeView.svelte';
  import AboutView from '@views/AboutView.svelte';
  import CategoryItem1View from '@views/CategoryItem1View.svelte';
  import CategoryItem2View from '@views/CategoryItem2View.svelte';
  import SettingsConfigView from '@views/SettingsConfigView.svelte';
  import Test1View from '@views/Test1View.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { sidebarOpen, modalOpen, themeMode, type ThemeMode } from '@features/ui/store';
  import { initTheme, toggleTheme, toggleSidebar, closeSidebar, closeModal } from '@features/ui/service';
  import { currentRoute } from '@features/router/store';
  import type { Route } from '@features/router/types';
  import { initRouter, disposeRouter } from '@features/router/service';
  import { activeRoute } from '@features/navigation/store';
  import { initSettings } from '@features/settings/service';
  import { initI18n } from '@features/i18n/service';

  let route: Route = 'home';
  let currentTheme: ThemeMode = 'light';
  let isSidebarOpen: boolean = false;
  let isModalOpen: boolean = false;

  const unsubTheme = themeMode.subscribe((v) => (currentTheme = v));
  const unsubSidebar = sidebarOpen.subscribe((v) => (isSidebarOpen = v));
  const unsubModal = modalOpen.subscribe((v) => (isModalOpen = v));
  const unsubRoute = currentRoute.subscribe((r) => {
    route = r;
    activeRoute.set(r);
  });
  onMount(async () => {
    initTheme();
    const s = await initSettings();
    await initI18n(s.locale);
    initRouter();
    return () => disposeRouter();
  });

  onDestroy(() => {
    unsubTheme();
    unsubSidebar();
    unsubModal();
    unsubRoute();
  });
</script>

<HeaderComponent onToggleTheme={toggleTheme} onToggleSidebar={toggleSidebar} theme={currentTheme} />

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
  {:else if route === 'test.test1'}
    <Test1View />
  {/if}
</main>

<ModalComponent open={isModalOpen} onClose={closeModal} title="Welcome">
  <p>This is a demo modal.</p>
 </ModalComponent>

<FooterComponent />

 


