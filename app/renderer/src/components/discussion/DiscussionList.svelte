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


  // Table columns configuration
  const columns = [
    {
      key: 'isFavorite',
      label: '',
      sortable: true,
      width: '50px',
      render: (value: boolean, row: Discussion) => {
        const star = value ? '⭐' : '☆';
        return `<button class="favorite-toggle" data-id="${row.id}">${star}</button>`;
      },
    },
    {
      key: 'title',
      label: $t('discussion.table.title'),
      sortable: true,
    },
    {
      key: 'agent.name',
      label: $t('discussion.table.agent'),
      sortable: true,
      getValue: (row: Discussion) => row.agent?.name || 'Unknown',
    },
    {
      key: 'updatedAt',
      label: $t('discussion.table.updated'),
      sortable: true,
      render: (value: Date) => {
        return new Date(value).toLocaleDateString();
      },
    },
    {
      key: 'actions',
      label: $t('discussion.table.actions'),
      sortable: false,
      width: '150px',
      render: (_value: any, row: Discussion) => {
        return `
          <button class="action-continue btn btn-sm btn-primary" data-id="${row.id}">
            ${$t('discussion.actions.continue')}
          </button>
          <button class="action-delete btn btn-sm btn-danger" data-id="${row.id}">
            ${$t('discussion.actions.delete')}
          </button>
        `;
      },
    },
  ];

  function handleTableAction(event: CustomEvent) {
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

  function handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    if (target.classList.contains('favorite-toggle')) {
      const id = parseInt(target.dataset.id || '0');
      const discussion = discussions.find(d => d.id === id);
      if (discussion && onToggleFavorite) {
        onToggleFavorite(discussion);
      }
    } else if (target.classList.contains('action-continue')) {
      const id = parseInt(target.dataset.id || '0');
      const discussion = discussions.find(d => d.id === id);
      if (discussion) {
        if (onSelect) {
          onSelect(discussion);
        } else {
          goto('discussion.chat', { discussionId: id });
        }
      }
    } else if (target.classList.contains('action-delete')) {
      const id = parseInt(target.dataset.id || '0');
      const discussion = discussions.find(d => d.id === id);
      if (discussion && onDelete) {
        onDelete(discussion);
      }
    }
  }

</script>

<div class="discussion-list">
  {#if discussions.length === 0}
    <div class="empty-state">
      <p>{$t('discussion.list.empty')}</p>
      <button
        class="btn btn-primary btn-lg"
        on:click={() => goto('discussion.new')}
      >
        {$t('discussion.list.newDiscussion')}
      </button>
    </div>
  {:else}
    <div class="list-header">
      <div class="list-controls">
        <button
          class="btn btn-primary"
          on:click={() => goto('discussion.new')}
        >
          {$t('discussion.list.newDiscussion')}
        </button>
      </div>
    </div>

    <div class="list-content" on:click={handleClick}>
      <Table
        data={discussions}
        {columns}
        sortable={true}
        filterable={true}
        on:action={handleTableAction}
      />
    </div>
  {/if}
</div>