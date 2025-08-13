<script lang="ts">
  /** File list table */
  type FileItem = { id: number; name: string; size: string; type: string; date: string };
  export let files: FileItem[] = [];

  function getFileTypeDisplay(name: string, rawType: string): string {
    if (rawType === 'folder') return 'folder';
    const dot = name.lastIndexOf('.');
    if (dot !== -1 && dot < name.length - 1) return name.slice(dot + 1).toLowerCase();
    return 'file';
  }

  let typeFilter: string = '';
  $: rows = files.map((f) => ({
    ...f,
    displayType: getFileTypeDisplay(f.name, f.type),
  }));
  $: typeOptions = Array.from(new Set(rows.map((r) => r.displayType))).sort((a, b) => a.localeCompare(b));
  $: displayed = typeFilter ? rows.filter((r) => r.displayType === typeFilter) : rows;
</script>

<div class="gc-table-wrapper">
  <table class="gc-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Size</th>
        <th>Type</th>
        <th>Modified</th>
      </tr>
      <tr>
        <th></th>
        <th></th>
        <th>
          <select class="input input--dense" bind:value={typeFilter}>
            <option value="">Filter types…</option>
            {#each typeOptions as opt}
              <option value={opt}>{opt}</option>
            {/each}
          </select>
        </th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each displayed as f}
        <tr>
          <td>{f.name}</td>
          <td>{f.size}</td>
          <td>{f.displayType}</td>
          <td>{f.date}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>


