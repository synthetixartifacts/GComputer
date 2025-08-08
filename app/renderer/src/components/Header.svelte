<script lang="ts">
  export let onToggleTheme: () => void;
  export let onToggleSidebar: () => void;
  export let title: string = 'GComputer';
  export let theme: 'light' | 'dark' = 'light';
</script>

<header class="gc-header">
  <div class="flex items-center gap-2">
    <button class="btn btn--secondary" on:click={onToggleSidebar}>Sidebar</button>
    <h1 class="text-lg font-semibold">{title}</h1>
  </div>
  <div class="flex items-center gap-2">
    <button class="btn btn--secondary gc-icon-btn" on:click={onToggleTheme} aria-label="Toggle theme">
      {#if theme === 'dark'}
        🌙
      {:else}
        ☀️
      {/if}
    </button>
    <a class="btn btn--link" href="#/styleguide">Styleguide</a>
  </div>
  
</header>

<style>
</style>


