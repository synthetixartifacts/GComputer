import { runMigrations } from '../../../packages/db/src/db/client.js';
import { providerService, modelService, agentService } from './services/index.js';

/**
 * Run database migrations
 */
export async function runDbMigrations(): Promise<void> {
  await runMigrations();
}

/**
 * Seed default data for AI management
 * Creates default providers, models, and agents if they don't exist
 */
export async function seedDefaultData(): Promise<void> {
  // Check if default data already exists
  const existingProviders = await providerService.list();
  if (existingProviders.length > 0) {
    return; // Data already seeded
  }

  // Default Providers
  const openaiProvider = await providerService.insert({
    code: 'openai',
    name: 'OpenAI',
    url: 'https://api.openai.com',
    authentication: 'bearer',
    configuration: '{}',
  });

  const anthropicProvider = await providerService.insert({
    code: 'anthropic',
    name: 'Anthropic',
    url: 'https://api.anthropic.com',
    authentication: 'x-api-key',
    configuration: '{}',
  });

  if (!openaiProvider || !anthropicProvider) {
    throw new Error('Failed to create default providers');
  }

  // Default Models
  const gpt4Model = await modelService.insert({
    code: 'gpt-4',
    name: 'GPT-4',
    model: 'gpt-4',
    inputPrice: 0.03,
    outputPrice: 0.06,
    endpoint: '/v1/chat/completions',
    params: '{"max_tokens": 4096, "temperature": 0.7}',
    messageLocation: 'choices.0.message.content',
    streamMessageLocation: 'choices.0.delta.content',
    inputTokenCountLocation: 'usage.prompt_tokens',
    outputTokenCountLocation: 'usage.completion_tokens',
    providerId: openaiProvider.id,
  });

  const claudeModel = await modelService.insert({
    code: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    model: 'claude-3-sonnet-20240229',
    inputPrice: 0.003,
    outputPrice: 0.015,
    endpoint: '/v1/messages',
    params: '{"max_tokens": 4096, "temperature": 0.7}',
    messageLocation: 'content.0.text',
    streamMessageLocation: 'delta.text',
    inputTokenCountLocation: 'usage.input_tokens',
    outputTokenCountLocation: 'usage.output_tokens',
    providerId: anthropicProvider.id,
  });

  if (!gpt4Model || !claudeModel) {
    throw new Error('Failed to create default models');
  }

  // Default Agents
  await agentService.insert({
    code: 'assistant',
    name: 'General Assistant',
    description: 'A helpful AI assistant for general tasks',
    version: '1.0',
    enable: true,
    isSystem: true,
    systemPrompt: 'You are a helpful AI assistant. Be concise and accurate.',
    configuration: '{"useMemory": true, "maxFileSize": 10}',
    modelId: gpt4Model.id,
  });

  await agentService.insert({
    code: 'researcher',
    name: 'Research Assistant',
    description: 'An AI assistant specialized in research and analysis',
    version: '1.0',
    enable: true,
    isSystem: true,
    systemPrompt: 'You are a research assistant. Provide detailed, well-sourced information.',
    configuration: '{"useMemory": true, "canBrowseUrl": true}',
    modelId: claudeModel.id,
  });
}