<script lang="ts">
  let path = '';
  let items: Array<{ name: string; dir: boolean }> = [];
  async function browse() {
    try {
      // placeholder; will be wired via preload IPC later
      items = [];
    } catch (err) {
      console.error(err);
    }
  }
  const year = new Date().getFullYear();
</script>

<main class="min-h-screen flex flex-col items-center justify-center p-8">
  <div class="w-full max-w-xl space-y-6">
    <h1 class="text-3xl font-bold text-center">Hello World — GComputer</h1>
    <p class="text-center text-gray-600">
      Svelte + Tailwind + SCSS is configured. Edit <code>app/renderer/src/App.svelte</code>.
    </p>

    <div class="flex items-center gap-2 justify-center">
      <input class="border rounded px-3 py-2 w-64" bind:value={path} placeholder="Path..." />
      <button class="button" on:click={browse}>Browse</button>
    </div>

    {#if items.length}
      <ul class="bg-white rounded border divide-y">
        {#each items as it}
          <li class="px-4 py-2">{it.dir ? '📁' : '📄'} {it.name}</li>
        {/each}
      </ul>
    {/if}

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


