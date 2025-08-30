<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy } from 'svelte';
  import FileList from '@components/FileList.svelte';
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());

  // Demo dataset with raw + display fields for table sorting and filtering
  type FileRow = { id: number; name: string; sizeDisplay: string; sizeBytes: number; type: 'file'|'folder'; dateDisplay: string; lastModified: number };
  function parseSizeDisplayToBytes(s: string): number {
    const m = s.trim().match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
    if (!m) return 0;
    const n = parseFloat(m[1]);
    const unit = m[2].toUpperCase();
    const k = 1024;
    if (unit === 'B') return n;
    if (unit === 'KB') return n * k;
    if (unit === 'MB') return n * k * k;
    if (unit === 'GB') return n * k * k * k;
    return 0;
  }
  const tableRows: FileRow[] = [
    { id: 1, name: 'Documents', sizeDisplay: '-', sizeBytes: 0, type: 'folder', dateDisplay: '2025-08-01', lastModified: new Date('2025-08-01').getTime() },
    { id: 2, name: 'report.pdf', sizeDisplay: '1.2 MB', sizeBytes: parseSizeDisplayToBytes('1.2 MB'), type: 'file', dateDisplay: '2025-07-10', lastModified: new Date('2025-07-10').getTime() },
    { id: 3, name: 'photo.jpg', sizeDisplay: '2.1 MB', sizeBytes: parseSizeDisplayToBytes('2.1 MB'), type: 'file', dateDisplay: '2025-05-22', lastModified: new Date('2025-05-22').getTime() },
    { id: 4, name: 'notes.txt', sizeDisplay: '4 KB', sizeBytes: parseSizeDisplayToBytes('4 KB'), type: 'file', dateDisplay: '2025-04-15', lastModified: new Date('2025-04-15').getTime() }
  ];

  // Convert demo rows into UiFileItem shape expected by FileList
  type UiLike = { id: string; name: string; size: string; type: 'file'|'folder'; date: string; location: string; sizeBytes: number; lastModified: number };
  $: demoFiles = tableRows.map((r) => ({
    id: String(r.id),
    name: r.name,
    size: r.sizeDisplay,
    type: r.type,
    date: r.dateDisplay,
    location: '',
    sizeBytes: r.sizeBytes,
    lastModified: r.lastModified,
  })) as UiLike[];
</script>

<section class="stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.styleguide.files.title')}</h2>
  <p class="opacity-80">{t('pages.styleguide.files.desc')}</p>

  <FileList files={demoFiles as any} showLocation={false} />
</section>


