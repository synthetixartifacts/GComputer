<script lang="ts">
  export let onToggleTheme: () => void;
  export let onToggleSidebar: () => void;
  export let title: string = 'GComputer';
  export let theme: 'light' | 'dark' | 'fun' = 'light';
</script>

<header class="gc-header">
  <div class="flex items-center gap-2">
    <button class="btn btn--secondary gc-icon-btn" on:click={onToggleSidebar} aria-label="Toggle sidebar">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
        <path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z" />
      </svg>
    </button>
    <h1 class="text-lg font-semibold">{title}</h1>
  </div>
  <div class="flex items-center gap-2">
    <button class="btn btn--secondary gc-icon-btn" on:click={onToggleTheme} aria-label="Toggle theme">
      {#if theme === 'fun'}
        🎉
      {:else if theme === 'dark'}
        🌙
      {:else}
        ☀️
      {/if}
    </button>
  </div>
</header>
