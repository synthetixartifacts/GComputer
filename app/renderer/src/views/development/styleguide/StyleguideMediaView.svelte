<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy } from 'svelte';
  import Modal from '@components/Modal.svelte';
  import GalleryGrid from '@components/GalleryGrid.svelte';
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());

  type Img = { id: number | string; src: string; alt: string; caption?: string };
  const images: Img[] = [
    { id: 1, src: 'https://picsum.photos/seed/a/600/400', alt: 'Random A', caption: 'Caption A' },
    { id: 2, src: 'https://picsum.photos/seed/b/600/800', alt: 'Random B', caption: 'Caption B' },
    { id: 3, src: 'https://picsum.photos/seed/c/800/600', alt: 'Random C' },
    { id: 4, src: 'https://picsum.photos/seed/d/600/600', alt: 'Random D' },
  ];
  let lightboxOpen = false;
  let lightboxImage: Img | null = null;
  function openLightbox(img: Img): void { lightboxImage = img; lightboxOpen = true; }
  function closeLightbox(): void { lightboxOpen = false; lightboxImage = null; }
</script>

<section class="container-page stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.styleguide.media.title')}</h2>
  <p class="opacity-80">{t('pages.styleguide.media.desc')}</p>

  <GalleryGrid items={images} columns={{ base: 2, md: 4 }} onSelect={(img) => openLightbox(img)} />

  <Modal open={lightboxOpen} onClose={closeLightbox} title="pages.styleguide.media.lightboxTitle">
    {#if lightboxImage}
      <figure class="grid gap-2">
        <img src={lightboxImage.src} alt={lightboxImage.alt} class="block max-h-[70vh] w-auto mx-auto" />
        <figcaption class="text-sm opacity-80">{lightboxImage.caption ?? lightboxImage.alt}</figcaption>
      </figure>
    {/if}
  </Modal>
</section>


