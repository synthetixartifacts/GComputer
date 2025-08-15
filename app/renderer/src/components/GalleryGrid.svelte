<script lang="ts">
  /**
   * Responsive gallery grid that renders ImageCard tiles.
   */
  import ImageCard from '@components/ImageCard.svelte';
  type GalleryItem = { id: number | string; src: string; alt: string; caption?: string; aspect?: string };
  export let items: GalleryItem[] = [];
  export let columns: { base: number; md?: number; lg?: number } = { base: 2, md: 4 };
  export let overlayOnHover: boolean = true;
  export let clickable: boolean = true;
  export let onSelect: (item: GalleryItem) => void = () => {};
  export let ariaLabel: string = 'Gallery';

  function templateCols(n: number): string { return `repeat(${n}, minmax(0, 1fr))`; }
</script>

<div class="grid gap-3" role="list" aria-label={ariaLabel} style={`grid-template-columns: ${templateCols(columns.base)};`}>
  {#each items as img (img.id)}
    <ImageCard
      src={img.src}
      alt={img.alt}
      caption={img.caption}
      aspect={img.aspect ?? '4/3'}
      {overlayOnHover}
      {clickable}
      on:select={() => onSelect(img)}
    />
  {/each}
  
</div>


