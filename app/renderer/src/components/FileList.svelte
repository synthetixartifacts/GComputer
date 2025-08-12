<script lang="ts">
  /** File list table */
  type FileItem = { id: number; name: string; size: string; type: 'file'|'folder'; date: string };
  export let files: FileItem[] = [];
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
    </thead>
    <tbody>
      {#each files as f}
        <tr>
          <td>{f.name}</td>
          <td>{f.size}</td>
          <td>{f.type}</td>
          <td>{f.date}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>


