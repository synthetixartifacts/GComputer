<script lang="ts">
  import BrowseView from '@views/BrowseView.svelte';
  import { openModal } from '@features/ui/service';
</script>

<section class="stack-md">
  <h1 class="text-3xl font-bold">Hello World — GComputer</h1>
  <p>Svelte + Tailwind + SCSS is configured.</p>
  <div class="flex gap-2">
    <button class="btn btn--primary" on:click={openModal}>Open Modal</button>
  </div>
  <BrowseView />
</section>


