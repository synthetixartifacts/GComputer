import { runMigrations } from '../../../packages/db/src/db/client.js';
import { providerService, modelService, agentService, configurationService } from './services/index.js';

/**
 * Run database migrations
 */
export async function runDbMigrations(): Promise<void> {
  await runMigrations();
}

/**
 * Seed default data for all entities
 * Creates default configurations, providers, models, and agents if they don't exist
 * This is the single entry point for all seeding operations
 */
export async function seedDefaultData(): Promise<void> {
  console.log('[seeding] Starting database seeding...');
  
  // Seed configurations first as other entities might depend on them
  await seedConfigurations();
  
  // Seed AI entities (providers, models, agents)
  await seedAIEntities();
  
  console.log('[seeding] Database seeding complete');
}

/**
 * Seed configuration values
 */
async function seedConfigurations(): Promise<void> {
  const existingConfigs = await configurationService.list();
  if (existingConfigs.length > 0) {
    console.log('[seeding] Configurations already exist, skipping.');
    return;
  }

  // Theme configuration
  await configurationService.insert({
    code: 'theme_mode',
    name: 'Theme Mode',
    type: 'select',
    value: 'light',
    defaultValue: 'light',
    options: JSON.stringify(['light', 'dark', 'fun']),
    description: 'Application theme mode',
    category: 'appearance',
    isSystem: false,
    isSecret: false,
    validation: JSON.stringify({ required: true })
  });

  // Language configuration
  await configurationService.insert({
    code: 'locale',
    name: 'Language',
    type: 'select',
    value: 'en',
    defaultValue: 'en',
    options: JSON.stringify(['en', 'fr']),
    description: 'Application language',
    category: 'localization',
    isSystem: false,
    isSecret: false,
    validation: JSON.stringify({ required: true })
  });

  // General configurations
  await configurationService.insert({
    code: 'auto_save',
    name: 'Auto Save',
    type: 'boolean',
    value: 'true',
    defaultValue: 'true',
    options: undefined,
    description: 'Automatically save changes',
    category: 'general',
    isSystem: false,
    isSecret: false,
    validation: JSON.stringify({ required: true })
  });

  await configurationService.insert({
    code: 'max_file_size',
    name: 'Max File Size (MB)',
    type: 'number',
    value: '10',
    defaultValue: '10',
    options: undefined,
    description: 'Maximum file size for uploads in MB',
    category: 'general',
    isSystem: false,
    isSecret: false,
    validation: JSON.stringify({ required: true, min: 1, max: 100 })
  });

  // Advanced configurations
  await configurationService.insert({
    code: 'api_timeout',
    name: 'API Timeout (seconds)',
    type: 'number',
    value: '30',
    defaultValue: '30',
    options: undefined,
    description: 'API request timeout in seconds',
    category: 'advanced',
    isSystem: false,
    isSecret: false,
    validation: JSON.stringify({ required: true, min: 5, max: 300 })
  });

  await configurationService.insert({
    code: 'enable_analytics',
    name: 'Enable Analytics',
    type: 'boolean',
    value: 'false',
    defaultValue: 'false',
    options: undefined,
    description: 'Enable usage analytics',
    category: 'advanced',
    isSystem: false,
    isSecret: false,
    validation: JSON.stringify({ required: true })
  });

  await configurationService.insert({
    code: 'debug_mode',
    name: 'Debug Mode',
    type: 'boolean',
    value: 'false',
    defaultValue: 'false',
    options: undefined,
    description: 'Enable debug mode for detailed logging',
    category: 'advanced',
    isSystem: false,
    isSecret: false,
    validation: JSON.stringify({ required: true })
  });

  console.log('[seeding] Default configurations created');
}

/**
 * Seed AI entities (providers, models, agents)
 */
async function seedAIEntities(): Promise<void> {
  // Check if AI entities already exist
  const existingProviders = await providerService.list();
  if (existingProviders.length > 0) {
    console.log('[seeding] AI entities already exist, skipping.');
    return;
  }

  // Create providers
  const openaiProvider = await providerService.insert({
    code: 'openai',
    name: 'OpenAI',
    url: 'https://api.openai.com',
    authentication: 'bearer',
    configuration: '{}'
  });

  const anthropicProvider = await providerService.insert({
    code: 'anthropic',
    name: 'Anthropic',
    url: 'https://api.anthropic.com',
    authentication: 'x-api-key',
    configuration: '{}'
  });

  if (!openaiProvider || !anthropicProvider) {
    throw new Error('Failed to create default providers');
  }

  // Create models
  const gpt4Model = await modelService.insert({
    code: 'gpt-4.1',
    name: 'GPT-4.1',
    model: 'gpt-4.1',
    inputPrice: 2.00,
    outputPrice: 8.00,
    endpoint: '/v1/chat/completions',
    params: '{"max_tokens": 4096, "temperature": 0.7}',
    messageLocation: 'choices.0.message.content',
    messageStreamLocation: 'choices.0.delta.content',
    inputTokenCountLocation: 'usage.prompt_tokens',
    outputTokenCountLocation: 'usage.completion_tokens',
    providerId: openaiProvider.id,
  });

  const claudeModel = await modelService.insert({
    code: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    model: 'claude-sonnet-4-20250514',
    inputPrice: 3.00,
    outputPrice: 15.00,
    endpoint: '/v1/messages',
    params: '{"max_tokens": 4096, "temperature": 0.7}',
    messageLocation: 'content.0.text',
    messageStreamLocation: 'delta.text',
    inputTokenCountLocation: 'usage.input_tokens',
    outputTokenCountLocation: 'usage.output_tokens',
    providerId: anthropicProvider.id,
  });

  if (!gpt4Model || !claudeModel) {
    throw new Error('Failed to create default models');
  }

  // Create agents
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

  console.log('[seeding] AI entities created (providers, models, agents)');
}

// Export for backwards compatibility if needed
export async function seedDefaultConfigurations(): Promise<void> {
  await seedConfigurations();
}