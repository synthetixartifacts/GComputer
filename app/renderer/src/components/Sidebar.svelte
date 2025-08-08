<script lang="ts">
  export let open: boolean = false;
  export let onClose: () => void;
</script>

<aside class="gc-sidebar {open ? 'gc-sidebar--open' : ''}">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-base font-semibold">Sidebar</h2>
    <button class="btn btn--secondary" on:click={onClose}>Close</button>
  </div>
  <nav class="grid gap-2">
    <a class="btn btn--link" href="#/">Home</a>
    <a class="btn btn--link" href="#/styleguide">Styleguide</a>
  </nav>
</aside>

<style>
</style>


