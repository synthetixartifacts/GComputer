<script lang="ts">
  /** File grid thumbnails */
  type FileItem = { id: number; name: string; size: string; type: 'file'|'folder'; date: string };
  export let files: FileItem[] = [];
</script>

<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
  {#each files as f}
    <div class="demo-box grid gap-1 p-2">
      <div class="aspect-square bg-[color:var(--color-surface)] border grid place-items-center text-4xl">{f.type === 'folder' ? '📁' : '📄'}</div>
      <div class="text-sm font-medium truncate" title={f.name}>{f.name}</div>
      <div class="text-xs opacity-70">{f.size} · {f.date}</div>
    </div>
  {/each}
</div>


