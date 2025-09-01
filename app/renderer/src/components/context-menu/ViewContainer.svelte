<script lang="ts">
  import { viewState } from '@features/context-menu/view-manager';
  import Alert from './Alert.svelte';
  import MainMenu from './MainMenu.svelte';
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
  
  $: currentView = $viewState.currentView;
  $: viewData = $viewState.viewData;
  $: transitionClass = getTransitionClass($viewState.transitionDirection);
  
  function getTransitionClass(direction?: 'forward' | 'back'): string {
    if (!direction) return '';
    return `context-menu-view--transition-${direction}`;
  }
</script>

<div class="context-menu-view {transitionClass}">
  {#if currentView === 'menu'}
    <MainMenu 
      {actions}
      {selectedText}
      {selectedIndex}
      {onActionClick}
      {onIndexChange}
    />
  {:else if currentView === 'alert' && viewData}
    <Alert config={viewData} />
  {:else if currentView === 'translate'}
    <!-- Translate view will be added later -->
    <div class="context-menu-view__placeholder">
      <p>Translate view (coming soon)</p>
    </div>
  {:else if currentView === 'summary'}
    <!-- Summary view will be added later -->
    <div class="context-menu-view__placeholder">
      <p>Summary view (coming soon)</p>
    </div>
  {:else}
    <!-- Fallback to menu if unknown view -->
    <MainMenu 
      {actions}
      {selectedText}
      {selectedIndex}
      {onActionClick}
      {onIndexChange}
    />
  {/if}
</div>