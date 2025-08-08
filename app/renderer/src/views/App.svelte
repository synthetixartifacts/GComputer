<script lang="ts">
  import BrowseView from './BrowseView.svelte';
  const year = new Date().getFullYear();
</script>

<main class="min-h-screen flex flex-col items-center justify-center p-8">
  <div class="w-full max-w-xl space-y-6">
    <h1 class="text-3xl font-bold text-center">Hello World — GComputer</h1>
    <p class="text-center text-gray-600">
      Svelte + Tailwind + SCSS is configured. Edit <code>app/renderer/src/App.svelte</code>.
    </p>

    <BrowseView />

    <footer class="text-center text-sm text-gray-500">© {year} GComputer</footer>
  </div>
</main>

<style lang="scss">
  main {
    h1 {
      letter-spacing: 0.2px;
    }
  }
</style>


