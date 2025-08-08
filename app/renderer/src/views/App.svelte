<script lang="ts">
  import Header from '@components/Header.svelte';
  import Footer from '@components/Footer.svelte';
  import Sidebar from '@components/Sidebar.svelte';
  import Modal from '@components/Modal.svelte';
  import StyleguideView from '@views/StyleguideView.svelte';
  import BrowseView from './BrowseView.svelte';
  import { onMount } from 'svelte';
  import { sidebarOpen, modalOpen, themeMode } from '@features/ui/store';
  import { initTheme, toggleTheme, toggleSidebar, closeSidebar, openModal, closeModal } from '@features/ui/service';

  let route: 'home' | 'styleguide' = 'home';
  function handleHashChange() {
    route = location.hash === '#/styleguide' ? 'styleguide' : 'home';
  }
  onMount(() => {
    initTheme();
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  });
</script>

<Header onToggleTheme={toggleTheme} onToggleSidebar={toggleSidebar} theme={$themeMode} />

<Sidebar open={$sidebarOpen} onClose={closeSidebar} />

<main class="container-page stack-lg py-6">
  {#if route === 'styleguide'}
    <StyleguideView />
  {:else}
    <section class="stack-md">
      <h1 class="text-3xl font-bold">Hello World — GComputer</h1>
      <p>Svelte + Tailwind + SCSS is configured.</p>
      <div class="flex gap-2">
        <button class="btn btn--primary" on:click={openModal}>Open Modal</button>
        <a class="btn btn--secondary" href="#/styleguide">Open Styleguide</a>
      </div>
      <BrowseView />
    </section>
    <!-- Include the styleguide on the home page for now to showcase all elements -->
    <StyleguideView />
  {/if}
</main>

<Modal open={$modalOpen} onClose={closeModal} title="Welcome">
  <p>This is a demo modal.</p>
</Modal>

<Footer />

<style lang="scss">
</style>


