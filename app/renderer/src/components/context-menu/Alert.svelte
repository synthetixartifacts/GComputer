<script lang="ts">
  import type { AlertConfig } from '@features/context-menu/types';
  
  interface Props {
    config: AlertConfig;
  }
  
  let { config }: Props = $props();
  
  $: icon = getIcon(config.type || 'info');
  $: typeClass = getTypeClass(config.type || 'info');
  
  function getIcon(type: string): string {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': 
      default: return 'ℹ';
    }
  }
  
  function getTypeClass(type: string): string {
    return `context-menu-alert--${type}`;
  }
</script>

<div class="context-menu-alert {typeClass}">
  <span class="context-menu-alert__icon">{icon}</span>
  <span class="context-menu-alert__message">{config.message}</span>
</div>