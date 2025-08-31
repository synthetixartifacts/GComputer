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
 * Checks each configuration individually by code and only inserts if missing
 */
async function seedConfigurations(): Promise<void> {
  const configurationsToSeed = [
    {
      code: 'theme_mode',
      name: 'Theme Mode',
      value: 'light',
      defaultValue: 'light',
      description: 'Application theme mode (light, dark, fun)'
    },
    {
      code: 'locale',
      name: 'Language',
      value: 'en',
      defaultValue: 'en',
      description: 'Application language (en, fr)'
    },
    {
      code: 'auto_save',
      name: 'Auto Save',
      value: 'true',
      defaultValue: 'true',
      description: 'Automatically save changes'
    },
    {
      code: 'max_file_size',
      name: 'Max File Size (MB)',
      value: '10',
      defaultValue: '10',
      description: 'Maximum file size for uploads in MB'
    },
    {
      code: 'api_timeout',
      name: 'API Timeout (seconds)',
      value: '30',
      defaultValue: '30',
      description: 'API request timeout in seconds'
    },
    {
      code: 'enable_analytics',
      name: 'Enable Analytics',
      value: 'false',
      defaultValue: 'false',
      description: 'Enable usage analytics'
    },
    {
      code: 'debug_mode',
      name: 'Debug Mode',
      value: 'false',
      defaultValue: 'false',
      description: 'Enable debug mode for detailed logging'
    },
    {
      code: 'default_agent',
      name: 'Default Agent',
      value: 'assistant',
      defaultValue: 'assistant',
      description: 'Main agent code for home page quick chat'
    },
    {
      code: 'context_menu_enabled',
      name: 'Context Menu Enabled',
      value: 'true',
      defaultValue: 'true',
      description: 'Enable the global context menu'
    },
    {
      code: 'context_menu_shortcut',
      name: 'Context Menu Shortcut',
      value: 'Alt+Space',
      defaultValue: 'Alt+Space',
      description: 'Keyboard shortcut to trigger the context menu'
    },
    {
      code: 'context_menu_actions',
      name: 'Context Menu Actions',
      value: JSON.stringify(['translate', 'fix-grammar', 'summarize', 'explain', 'screenshot', 'copy', 'paste']),
      defaultValue: JSON.stringify(['translate', 'fix-grammar', 'summarize', 'explain', 'screenshot', 'copy', 'paste']),
      description: 'Enabled actions in the context menu'
    }
  ];

  let createdCount = 0;
  
  for (const config of configurationsToSeed) {
    try {
      // Check if configuration already exists by code
      const existing = await configurationService.getByCode(config.code);
      
      if (existing) {
        console.log(`[seeding] Configuration '${config.code}' already exists, skipping.`);
        continue;
      }
      
      // Insert the configuration
      await configurationService.insert(config);
      console.log(`[seeding] Created configuration '${config.code}'`);
      createdCount++;
      
    } catch (error) {
      console.error(`[seeding] Failed to create configuration '${config.code}':`, error);
    }
  }

  if (createdCount > 0) {
    console.log(`[seeding] Created ${createdCount} new configurations`);
  } else {
    console.log('[seeding] All configurations already exist');
  }
}

/**
 * Seed AI entities (providers, models, agents)
 * Checks each entity individually by code and only inserts if missing
 */
async function seedAIEntities(): Promise<void> {
  // Seed providers first
  const providersCreated = await seedProviders();
  
  // Seed models (depends on providers)
  const modelsCreated = await seedModels();
  
  // Seed agents (depends on models)
  const agentsCreated = await seedAgents();
  
  const totalCreated = providersCreated + modelsCreated + agentsCreated;
  if (totalCreated > 0) {
    console.log(`[seeding] Created ${totalCreated} new AI entities`);
  } else {
    console.log('[seeding] All AI entities already exist');
  }
}

/**
 * Seed AI providers individually by code
 */
async function seedProviders(): Promise<number> {
  const providersToSeed = [
    {
      code: 'openai',
      name: 'OpenAI',
      url: 'https://api.openai.com',
      authentication: 'bearer',
      configuration: '{}'
    },
    {
      code: 'anthropic',
      name: 'Anthropic', 
      url: 'https://api.anthropic.com',
      authentication: 'x-api-key',
      configuration: '{}'
    }
  ];

  let createdCount = 0;
  
  for (const provider of providersToSeed) {
    try {
      // Check if provider already exists by code
      const existing = await providerService.list({ code: provider.code });
      
      if (existing && existing.length > 0) {
        console.log(`[seeding] Provider '${provider.code}' already exists, skipping.`);
        continue;
      }
      
      // Insert the provider
      await providerService.insert(provider);
      console.log(`[seeding] Created provider '${provider.code}'`);
      createdCount++;
      
    } catch (error) {
      console.error(`[seeding] Failed to create provider '${provider.code}':`, error);
    }
  }
  
  return createdCount;
}

/**
 * Seed AI models individually by code
 */
async function seedModels(): Promise<number> {
  // Get existing providers for foreign key references
  const openaiProviders = await providerService.list({ code: 'openai' });
  const anthropicProviders = await providerService.list({ code: 'anthropic' });
  
  if (!openaiProviders || openaiProviders.length === 0) {
    console.warn('[seeding] OpenAI provider not found, skipping OpenAI models');
  }
  if (!anthropicProviders || anthropicProviders.length === 0) {
    console.warn('[seeding] Anthropic provider not found, skipping Anthropic models');
  }

  const modelsToSeed = [];
  
  if (openaiProviders && openaiProviders.length > 0) {
    modelsToSeed.push({
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
      providerId: openaiProviders[0].id,
    });
  }
  
  if (anthropicProviders && anthropicProviders.length > 0) {
    modelsToSeed.push({
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
      providerId: anthropicProviders[0].id,
    });
  }

  let createdCount = 0;
  
  for (const model of modelsToSeed) {
    try {
      // Check if model already exists by code
      const existing = await modelService.list({ code: model.code });
      
      if (existing && existing.length > 0) {
        console.log(`[seeding] Model '${model.code}' already exists, skipping.`);
        continue;
      }
      
      // Insert the model
      await modelService.insert(model);
      console.log(`[seeding] Created model '${model.code}'`);
      createdCount++;
      
    } catch (error) {
      console.error(`[seeding] Failed to create model '${model.code}':`, error);
    }
  }
  
  return createdCount;
}

/**
 * Seed AI agents individually by code
 */
async function seedAgents(): Promise<number> {
  // Get existing models for foreign key references
  const gpt4Models = await modelService.list({ code: 'gpt-4.1' });
  const claudeModels = await modelService.list({ code: 'claude-sonnet-4' });
  
  if (!gpt4Models || gpt4Models.length === 0) {
    console.warn('[seeding] GPT-4.1 model not found, skipping GPT agents');
  }
  if (!claudeModels || claudeModels.length === 0) {
    console.warn('[seeding] Claude model not found, skipping Claude agents');
  }

  const agentsToSeed = [];
  
  if (gpt4Models && gpt4Models.length > 0) {
    agentsToSeed.push({
      code: 'assistant',
      name: 'General Assistant',
      description: 'A helpful AI assistant for general tasks',
      version: '1.0',
      enable: true,
      isSystem: true,
      systemPrompt: 'You are a helpful AI assistant. Be concise and accurate.',
      configuration: '{"useMemory": true, "maxFileSize": 10}',
      modelId: gpt4Models[0].id,
    });
  }
  
  if (claudeModels && claudeModels.length > 0) {
    agentsToSeed.push({
      code: 'researcher',
      name: 'Research Assistant',
      description: 'An AI assistant specialized in research and analysis',
      version: '1.0',
      enable: true,
      isSystem: true,
      systemPrompt: 'You are a research assistant. Provide detailed, well-sourced information.',
      configuration: '{"useMemory": true, "canBrowseUrl": true}',
      modelId: claudeModels[0].id,
    });
    
    agentsToSeed.push({
      code: 'translator',
      name: 'TranslateBot',
      description: 'A specialized AI translator for English-French bidirectional translation',
      version: '1.0',
      enable: true,
      isSystem: true,
      systemPrompt: `You are TranslateBot, a specialized AI translator focused exclusively on bidirectional translation between English and French. Your sole purpose is to provide accurate, context-aware translations while maintaining the original meaning and tone of the content.

## Core Rules
1. Only translate between English and French
2. Automatically detect the input language and translate to the opposite language
3. Maintain exact meaning and tone of the original text
4. Preserve formatting and punctuation styles
5. Return input as-is for:
   - Single letters
   - Numbers
   - Non-translatable content
   - Content in other languages

## Translation Guidelines
- Provide direct translations without additional commentary
- Consider cultural context and business terminology
- Maintain professional language standards
- Preserve any technical terms specific to %company_name%'s industry
- Keep idiomatic expressions culturally relevant

## Response Format
- Return only the translated text
- No explanations or additional content
- Preserve original formatting and structure
- Maintain any special characters or formatting markers

Remember: Your role is strictly translation. Do not add explanations, suggestions, or any content beyond the pure translation of the provided text.`,
      configuration: '{"useMemory": false}',
      modelId: claudeModels[0].id,
    });
  }

  let createdCount = 0;
  
  for (const agent of agentsToSeed) {
    try {
      // Check if agent already exists by code
      const existing = await agentService.list({ code: agent.code });
      
      if (existing && existing.length > 0) {
        console.log(`[seeding] Agent '${agent.code}' already exists, skipping.`);
        continue;
      }
      
      // Insert the agent
      await agentService.insert(agent);
      console.log(`[seeding] Created agent '${agent.code}'`);
      createdCount++;
      
    } catch (error) {
      console.error(`[seeding] Failed to create agent '${agent.code}':`, error);
    }
  }
  
  return createdCount;
}

// Export for backwards compatibility if needed
export async function seedDefaultConfigurations(): Promise<void> {
  await seedConfigurations();
}