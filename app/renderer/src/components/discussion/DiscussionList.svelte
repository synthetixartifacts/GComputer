<script lang="ts">
  import { onMount } from 'svelte';
  import Table from '@components/Table.svelte';
  import type { Discussion } from '@features/discussion/types';
  import { discussionService } from '@features/discussion/service';
  import { goto } from '@features/router/service';
  import { t } from '@ts/i18n';

  export let discussions: Discussion[] = [];
  export let onSelect: ((discussion: Discussion) => void) | null = null;
  export let onDelete: ((discussion: Discussion) => void) | null = null;
  export let onToggleFavorite: ((discussion: Discussion) => void) | null = null;

  // Make columns reactive to translation changes
  $: columns = [
    {
      id: 'title',
      title: $t('discussion.table.title'),
      sortable: true,
    },
    {
      id: 'agent',
      title: $t('discussion.table.agent'),
      sortable: true,
      access: (row: Discussion) => row.agent?.name || 'Unknown',
    },
    {
      id: 'updatedAt',
      title: $t('discussion.table.updated'),
      sortable: true,
      access: (row: Discussion) => new Date(row.updatedAt).toLocaleDateString(),
    },
  ];

  function handleTableAction(event: CustomEvent): void {
    const { action, row } = event.detail;
    
    if (action === 'row-click') {
      if (onSelect) {
        onSelect(row);
      } else {
        // Default behavior: navigate to discussion
        goto('discussion.chat', { discussionId: row.id });
      }
    }
  }

  function handleSelect(discussion: Discussion): void {
    if (onSelect) {
      onSelect(discussion);
    } else {
      goto('discussion.chat', { discussionId: discussion.id });
    }
  }
  
  function handleDelete(discussion: Discussion): void {
    if (onDelete) {
      onDelete(discussion);
    }
  }
  
  function handleToggleFavorite(discussion: Discussion): void {
    if (onToggleFavorite) {
      onToggleFavorite(discussion);
    }
  }

</script>

<div class="discussion-list">
  {#if discussions.length === 0}
    <div class="empty-state">
      <p>{$t('discussion.list.empty')}</p>
      <button
        class="btn btn-primary btn-lg"
        on:click={() => goto('discussion.agentSelection')}
      >
        {$t('discussion.list.newDiscussion')}
      </button>
    </div>
  {:else}
    <div class="list-content">
      <Table
        rows={discussions}
        {columns}
        showDefaultActions={false}
        on:action={handleTableAction}
      >
        <svelte:fragment slot="actions" let:row>
          <button 
            class="btn btn-sm btn-primary" 
            on:click={() => handleSelect(row)}
            title={$t('discussion.actions.continue')}
          >
            💬
          </button>
          {#if row.isFavorite}
            <button 
              class="btn btn-sm btn-ghost" 
              on:click={() => handleToggleFavorite(row)}
              title={$t('discussion.header.unfavorite')}
            >
              ⭐
            </button>
          {:else}
            <button 
              class="btn btn-sm btn-ghost" 
              on:click={() => handleToggleFavorite(row)}
              title={$t('discussion.header.favorite')}
            >
              ☆
            </button>
          {/if}
          <button 
            class="btn btn-sm btn-danger" 
            on:click={() => handleDelete(row)}
            title={$t('discussion.actions.delete')}
          >
            🗑️
          </button>
        </svelte:fragment>
      </Table>
    </div>
  {/if}
</div>