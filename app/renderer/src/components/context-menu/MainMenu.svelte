<script lang="ts">
  import { t } from '@ts/i18n/store';
  import type { ContextMenuAction } from '@features/context-menu/types';
  
  interface Props {
    actions: ContextMenuAction[];
    selectedText: string;
    selectedIndex: number;
    onActionClick: (action: ContextMenuAction) => void;
    onIndexChange: (index: number) => void;
  }
  
  let { 
    actions, 
    selectedText, 
    selectedIndex, 
    onActionClick,
    onIndexChange 
  }: Props = $props();
  
  $: hasText = selectedText.length > 0;
  $: groupedActions = groupActionsByCategory(actions);
  
  function groupActionsByCategory(actionsList: ContextMenuAction[]): Record<string, ContextMenuAction[]> {
    const groups: Record<string, ContextMenuAction[]> = {};
    
    actionsList.forEach(action => {
      const category = action.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(action);
    });
    
    return groups;
  }
  
  function handleActionClick(action: ContextMenuAction): void {
    console.log('[MainMenu] Action clicked:', action.id);
    console.log('[MainMenu] Action enabled:', action.enabled, 'requiresText:', action.requiresText, 'hasText:', hasText);
    
    if (action.enabled !== false && (!action.requiresText || hasText)) {
      console.log('[MainMenu] Calling onActionClick');
      onActionClick(action);
    } else {
      console.log('[MainMenu] Action blocked');
    }
  }
  
  function handleMouseEnter(index: number): void {
    onIndexChange(index);
  }
</script>

<div class="context-menu-main">
  {#if hasText}
    <div class="context-menu-main__selected-text">
      <span class="context-menu-main__selected-label">{$t('contextMenu.selectedText')}:</span>
      <span class="context-menu-main__selected-content">
        {selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}
      </span>
    </div>
  {/if}
  
  <div class="context-menu-main__actions">
    {#each Object.entries(groupedActions) as [category, categoryActions]}
      {#if categoryActions.length > 0}
        <div class="context-menu-main__group">
          <div class="context-menu-main__group-label">
            {$t(`contextMenu.categories.${category}`)}
          </div>
          {#each categoryActions as action, index}
            {@const actionIndex = actions.indexOf(action)}
            {@const isSelected = actionIndex === selectedIndex}
            {@const isDisabled = action.enabled === false || (action.requiresText && !hasText)}
            
            <button
              class="context-menu-main__action"
              class:context-menu-main__action--selected={isSelected}
              class:context-menu-main__action--disabled={isDisabled}
              disabled={isDisabled}
              on:click={() => handleActionClick(action)}
              on:mouseenter={() => handleMouseEnter(actionIndex)}
            >
              <span class="context-menu-main__action-icon">{action.icon}</span>
              <span class="context-menu-main__action-label">{$t(action.label)}</span>
              {#if action.shortcut}
                <span class="context-menu-main__action-shortcut">{action.shortcut}</span>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    {/each}
  </div>
  
  <div class="context-menu-main__hint">
    <span>{$t('contextMenu.shortcuts.navigation')}</span>
    <span class="context-menu-main__hint-separator">•</span>
    <span>ESC {$t('contextMenu.shortcuts.close')}</span>
  </div>
</div>