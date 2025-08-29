/**
 * Default Agent Helper
 * Provides functionality to get the default agent for the home page
 */

import { getConfigurationByCode } from '@features/admin/service';
import { listAgents } from '@features/admin/service';
import type { Agent } from '@features/admin/types';

/**
 * Get the default agent based on the default_agent configuration
 * @returns Promise<Agent | null> The default agent or null if not found
 */
export async function getDefaultAgent(): Promise<Agent | null> {
  try {
    // Get all agents first
    const agents = await listAgents();
    
    if (agents.length === 0) {
      console.warn('[default-agent] No agents found in database');
      return null;
    }
    
    // Try to get the main agent code from configuration
    let defaultAgentConfig = await getConfigurationByCode('default_agent');
    let agentCode = defaultAgentConfig?.value ?? 'assistant';
    
    // Find agent with matching code
    let defaultAgent = agents.find(agent => agent.code === agentCode);
    
    // If configured agent not found, fall back to first available agent
    if (!defaultAgent) {
      console.warn(`[default-agent] Agent with code "${agentCode}" not found, using first available agent`);
      defaultAgent = agents[0];
    }
    
    return defaultAgent;
  } catch (error) {
    console.error('[default-agent] Failed to get default agent:', error);
    return null;
  }
}