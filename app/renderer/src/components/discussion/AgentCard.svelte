<script lang="ts">
  import type { Agent } from '@features/admin/types';
  import { t } from '@ts/i18n';

  export let agent: Agent;
  export let onClick: ((agent: Agent) => void) | null = null;
  export let selected: boolean = false;

  function handleClick(): void {
    if (onClick) {
      onClick(agent);
    }
  }
</script>

<button
  class="agent-card"
  class:selected
  class:disabled={!agent.enable}
  on:click={handleClick}
  disabled={!agent.enable}
>
  <div class="agent-card-header">
    <h3 class="agent-name">{agent.name}</h3>
    {#if agent.isSystem}
      <span class="system-badge">{$t('discussion.agent.system')}</span>
    {/if}
    {#if !agent.enable}
      <span class="disabled-badge">{$t('discussion.agent.disabled')}</span>
    {/if}
  </div>
  
  <div class="agent-card-body">
    <p class="agent-description">{agent.description || $t('discussion.agent.noDescription')}</p>
    
    <div class="agent-meta">
      <span class="agent-version">v{agent.version}</span>
      <span class="agent-code">{agent.code}</span>
    </div>
  </div>
</button>