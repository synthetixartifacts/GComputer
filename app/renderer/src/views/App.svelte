<script lang="ts">
  import Header from '@components/Header.svelte';
  import Footer from '@components/Footer.svelte';
  import Sidebar from '@components/Sidebar.svelte';
  import Modal from '@components/Modal.svelte';
  import StyleguideView from '@views/StyleguideView.svelte';
  import HomeView from '@views/HomeView.svelte';
  import AboutView from '@views/AboutView.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { sidebarOpen, modalOpen, themeMode, type ThemeMode } from '@features/ui/store';
  import { initTheme, toggleTheme, toggleSidebar, closeSidebar, closeModal } from '@features/ui/service';
  import { currentRoute } from '@features/router/store';
  import type { Route } from '@features/router/types';
  import { initRouter, disposeRouter } from '@features/router/service';

  let route: Route = 'home';
  let currentTheme: ThemeMode = 'light';
  let isSidebarOpen: boolean = false;
  let isModalOpen: boolean = false;

  const unsubTheme = themeMode.subscribe((v) => (currentTheme = v));
  const unsubSidebar = sidebarOpen.subscribe((v) => (isSidebarOpen = v));
  const unsubModal = modalOpen.subscribe((v) => (isModalOpen = v));
  const unsubRoute = currentRoute.subscribe((r) => (route = r));
  onMount(() => {
    initTheme();
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

<Header onToggleTheme={toggleTheme} onToggleSidebar={toggleSidebar} theme={currentTheme} />

<Sidebar open={isSidebarOpen} onClose={closeSidebar} />

<main class="container-page stack-lg py-6">
  {#if route === 'styleguide'}
    <StyleguideView />
  {:else if route === 'about'}
    <AboutView />
  {:else}
    <HomeView />
  {/if}
</main>

<Modal open={isModalOpen} onClose={closeModal} title="Welcome">
  <p>This is a demo modal.</p>
</Modal>

<Footer />

<style lang="scss">
</style>


