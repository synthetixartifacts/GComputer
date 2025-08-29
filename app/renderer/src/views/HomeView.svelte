<script lang="ts">
  import { onMount } from 'svelte';
  import { getDefaultAgent } from '@features/discussion/default-agent';
  import { goto } from '@features/router/service';
  
  onMount(async () => {
    const defaultAgent = await getDefaultAgent();
    if (defaultAgent) {
      // Redirect to discussion chat with the default agent
      goto('discussion.chat', { agentId: defaultAgent.id });
    } else {
      // Redirect to discussion chat without agent (will show agent selection)
      goto('discussion.chat');
    }
  });
</script>