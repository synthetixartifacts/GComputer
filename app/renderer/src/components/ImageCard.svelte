<script lang="ts">
  /**
   * Image card with optional caption and hover overlay. Emits `select` when clicked.
   */
  import { createEventDispatcher } from 'svelte';

  export let src: string;
  export let alt: string;
  export let caption: string | undefined = undefined;
  export let aspect: string = '4/3';
  export let overlayOnHover: boolean = true;
  export let clickable: boolean = true;

  const dispatch = createEventDispatcher<{ select: { src: string; alt: string; caption?: string } }>();

  function handleClick(): void {
    if (!clickable) return;
    dispatch('select', { src, alt, caption });
  }
</script>

<button type="button" class="group relative overflow-hidden border" on:click={handleClick} aria-label={alt}>
  <img src={src} alt={alt} class="block w-full h-full object-cover" style={`aspect-ratio: ${aspect}`} loading="lazy" />
  {#if overlayOnHover}
    <span class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-base"></span>
  {/if}
  {#if caption}
    <span class="absolute bottom-0 left-0 right-0 text-white text-xs p-1 bg-gradient-to-t from-black/60 to-transparent">{caption}</span>
  {/if}
</button>


