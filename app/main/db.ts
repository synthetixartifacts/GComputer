import path from 'node:path';
import { ipcMain } from 'electron';
import { and, like, eq } from 'drizzle-orm';
// Import database functions from workspace package (bundled by esbuild)
import { getOrm, saveDatabase, runMigrations } from '../../packages/db/src/db/client.js';
import { test, aiProviders, aiModels, aiAgents } from '../../packages/db/src/db/schema.js';

export interface TestFilters {
  column1?: string;
  column2?: string;
}

export interface TestInsert {
  column1: string | null;
  column2: string | null;
}

export interface TestUpdate {
  id: number;
  column1?: string | null;
  column2?: string | null;
}

// Admin interfaces
export interface ProviderFilters {
  code?: string;
  name?: string;
  url?: string;
}

export interface ProviderInsert {
  code: string;
  name: string;
  url: string;
  authentication: string;
  configuration?: string;
}

export interface ProviderUpdate {
  id: number;
  code?: string;
  name?: string;
  url?: string;
  authentication?: string;
  configuration?: string;
}

export interface ModelFilters {
  code?: string;
  name?: string;
  model?: string;
}

export interface ModelInsert {
  code: string;
  name: string;
  model: string;
  inputPrice?: number;
  outputPrice?: number;
  endpoint: string;
  params?: string;
  messageLocation?: string;
  streamMessageLocation?: string;
  inputTokenCountLocation?: string;
  outputTokenCountLocation?: string;
  providerId: number;
}

export interface ModelUpdate {
  id: number;
  code?: string;
  name?: string;
  model?: string;
  inputPrice?: number;
  outputPrice?: number;
  endpoint?: string;
  params?: string;
  messageLocation?: string;
  streamMessageLocation?: string;
  inputTokenCountLocation?: string;
  outputTokenCountLocation?: string;
  providerId?: number;
}

export interface AgentFilters {
  code?: string;
  name?: string;
  version?: string;
}

export interface AgentInsert {
  code: string;
  name: string;
  description?: string;
  version?: string;
  enable?: boolean;
  isSystem?: boolean;
  systemPrompt?: string;
  configuration?: string;
  modelId: number;
}

export interface AgentUpdate {
  id: number;
  code?: string;
  name?: string;
  description?: string;
  version?: string;
  enable?: boolean;
  isSystem?: boolean;
  systemPrompt?: string;
  configuration?: string;
  modelId?: number;
}

export async function runDbMigrations(): Promise<void> {
  await runMigrations();
}

export async function seedDefaultData(): Promise<void> {
  const orm = await getOrm();
  
  // Check if default data already exists
  const existingProviders = await orm.select().from(aiProviders).limit(1);
  if (existingProviders.length > 0) {
    return; // Data already seeded
  }

  const now = new Date();

  // Default Providers
  const [openaiProvider] = await orm.insert(aiProviders).values({
    code: 'openai',
    name: 'OpenAI',
    url: 'https://api.openai.com',
    authentication: 'bearer',
    configuration: '{}',
    createdAt: now,
    updatedAt: now,
  }).returning();

  const [anthropicProvider] = await orm.insert(aiProviders).values({
    code: 'anthropic',
    name: 'Anthropic',
    url: 'https://api.anthropic.com',
    authentication: 'x-api-key',
    configuration: '{}',
    createdAt: now,
    updatedAt: now,
  }).returning();

  // Default Models
  const [gpt4Model] = await orm.insert(aiModels).values({
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
    createdAt: now,
    updatedAt: now,
  }).returning();

  const [claudeModel] = await orm.insert(aiModels).values({
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
    createdAt: now,
    updatedAt: now,
  }).returning();

  // Default Agents
  await orm.insert(aiAgents).values({
    code: 'assistant',
    name: 'General Assistant',
    description: 'A helpful AI assistant for general tasks',
    version: '1.0',
    enable: true,
    isSystem: true,
    systemPrompt: 'You are a helpful AI assistant. Be concise and accurate.',
    configuration: '{"useMemory": true, "maxFileSize": 10}',
    modelId: gpt4Model.id,
    createdAt: now,
    updatedAt: now,
  });

  await orm.insert(aiAgents).values({
    code: 'researcher',
    name: 'Research Assistant',
    description: 'An AI assistant specialized in research and analysis',
    version: '1.0',
    enable: true,
    isSystem: true,
    systemPrompt: 'You are a research assistant. Provide detailed, well-sourced information.',
    configuration: '{"useMemory": true, "canBrowseUrl": true}',
    modelId: claudeModel.id,
    createdAt: now,
    updatedAt: now,
  });

  saveDatabase();
}

export function registerDbIpc(): void {
  ipcMain.handle('db:test:list', async (_evt, filters?: TestFilters) => {
    const orm = await getOrm();
    const f = filters ?? {};
    const whereClauses = [] as any[];
    if (f.column1 && f.column1.trim() !== '') {
      whereClauses.push(like(test.column1, `%${f.column1}%`));
    }
    if (f.column2 && f.column2.trim() !== '') {
      whereClauses.push(like(test.column2, `%${f.column2}%`));
    }

    const rows = await orm
      .select()
      .from(test)
      .where(whereClauses.length ? and(...whereClauses) : undefined);
    return rows;
  });

  ipcMain.handle('db:test:insert', async (_evt, payload: TestInsert) => {
    const orm = await getOrm();
    const values = {
      column1: payload.column1 ?? null,
      column2: payload.column2 ?? null,
    } as const;
    const res = await orm.insert(test).values(values).returning();
    saveDatabase();
    return res[0] ?? null;
  });

  ipcMain.handle('db:test:update', async (_evt, payload: TestUpdate) => {
    const orm = await getOrm();
    const { id, column1, column2 } = payload;
    const res = await orm
      .update(test)
      .set({
        ...(column1 !== undefined ? { column1 } : {}),
        ...(column2 !== undefined ? { column2 } : {}),
      })
      .where(eq(test.id, id))
      .returning();
    saveDatabase();
    return res[0] ?? null;
  });

  ipcMain.handle('db:test:delete', async (_evt, id: number) => {
    const orm = await getOrm();
    await orm.delete(test).where(eq(test.id, id));
    saveDatabase();
    return { ok: true } as const;
  });

  ipcMain.handle('db:test:truncate', async () => {
    const orm = await getOrm();
    await orm.delete(test);
    saveDatabase();
    return { ok: true } as const;
  });

  // Admin Provider handlers
  ipcMain.handle('db:admin:providers:list', async (_evt, filters?: ProviderFilters) => {
    const orm = await getOrm();
    const f = filters ?? {};
    const whereClauses = [] as any[];
    if (f.code && f.code.trim() !== '') {
      whereClauses.push(like(aiProviders.code, `%${f.code}%`));
    }
    if (f.name && f.name.trim() !== '') {
      whereClauses.push(like(aiProviders.name, `%${f.name}%`));
    }
    if (f.url && f.url.trim() !== '') {
      whereClauses.push(like(aiProviders.url, `%${f.url}%`));
    }

    const rows = await orm
      .select()
      .from(aiProviders)
      .where(whereClauses.length ? and(...whereClauses) : undefined)
      .orderBy(aiProviders.name);
    return rows;
  });

  ipcMain.handle('db:admin:providers:insert', async (_evt, payload: ProviderInsert) => {
    const orm = await getOrm();
    const now = new Date();
    const values = {
      code: payload.code,
      name: payload.name,
      url: payload.url,
      authentication: payload.authentication,
      configuration: payload.configuration ?? '{}',
      createdAt: now,
      updatedAt: now,
    } as const;
    const res = await orm.insert(aiProviders).values(values).returning();
    saveDatabase();
    return res[0] ?? null;
  });

  ipcMain.handle('db:admin:providers:update', async (_evt, payload: ProviderUpdate) => {
    const orm = await getOrm();
    const { id, ...updates } = payload;
    const res = await orm
      .update(aiProviders)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(aiProviders.id, id))
      .returning();
    saveDatabase();
    return res[0] ?? null;
  });

  ipcMain.handle('db:admin:providers:delete', async (_evt, id: number) => {
    const orm = await getOrm();
    await orm.delete(aiProviders).where(eq(aiProviders.id, id));
    saveDatabase();
    return { ok: true } as const;
  });

  // Admin Model handlers
  ipcMain.handle('db:admin:models:list', async (_evt, filters?: ModelFilters) => {
    const orm = await getOrm();
    const f = filters ?? {};
    const whereClauses = [] as any[];
    if (f.code && f.code.trim() !== '') {
      whereClauses.push(like(aiModels.code, `%${f.code}%`));
    }
    if (f.name && f.name.trim() !== '') {
      whereClauses.push(like(aiModels.name, `%${f.name}%`));
    }
    if (f.model && f.model.trim() !== '') {
      whereClauses.push(like(aiModels.model, `%${f.model}%`));
    }

    const rows = await orm
      .select({
        id: aiModels.id,
        code: aiModels.code,
        name: aiModels.name,
        model: aiModels.model,
        inputPrice: aiModels.inputPrice,
        outputPrice: aiModels.outputPrice,
        endpoint: aiModels.endpoint,
        params: aiModels.params,
        messageLocation: aiModels.messageLocation,
        streamMessageLocation: aiModels.streamMessageLocation,
        inputTokenCountLocation: aiModels.inputTokenCountLocation,
        outputTokenCountLocation: aiModels.outputTokenCountLocation,
        providerId: aiModels.providerId,
        createdAt: aiModels.createdAt,
        updatedAt: aiModels.updatedAt,
        provider: {
          id: aiProviders.id,
          name: aiProviders.name,
          code: aiProviders.code,
        },
      })
      .from(aiModels)
      .leftJoin(aiProviders, eq(aiModels.providerId, aiProviders.id))
      .where(whereClauses.length ? and(...whereClauses) : undefined)
      .orderBy(aiModels.name);
    return rows;
  });

  ipcMain.handle('db:admin:models:insert', async (_evt, payload: ModelInsert) => {
    const orm = await getOrm();
    const now = new Date();
    const values = {
      code: payload.code,
      name: payload.name,
      model: payload.model,
      inputPrice: payload.inputPrice ?? null,
      outputPrice: payload.outputPrice ?? null,
      endpoint: payload.endpoint,
      params: payload.params ?? '{}',
      messageLocation: payload.messageLocation ?? null,
      streamMessageLocation: payload.streamMessageLocation ?? null,
      inputTokenCountLocation: payload.inputTokenCountLocation ?? null,
      outputTokenCountLocation: payload.outputTokenCountLocation ?? null,
      providerId: payload.providerId,
      createdAt: now,
      updatedAt: now,
    } as const;
    const res = await orm.insert(aiModels).values(values).returning();
    saveDatabase();
    return res[0] ?? null;
  });

  ipcMain.handle('db:admin:models:update', async (_evt, payload: ModelUpdate) => {
    const orm = await getOrm();
    const { id, ...updates } = payload;
    const res = await orm
      .update(aiModels)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(aiModels.id, id))
      .returning();
    saveDatabase();
    return res[0] ?? null;
  });

  ipcMain.handle('db:admin:models:delete', async (_evt, id: number) => {
    const orm = await getOrm();
    await orm.delete(aiModels).where(eq(aiModels.id, id));
    saveDatabase();
    return { ok: true } as const;
  });

  // Admin Agent handlers  
  ipcMain.handle('db:admin:agents:list', async (_evt, filters?: AgentFilters) => {
    const orm = await getOrm();
    const f = filters ?? {};
    const whereClauses = [] as any[];
    if (f.code && f.code.trim() !== '') {
      whereClauses.push(like(aiAgents.code, `%${f.code}%`));
    }
    if (f.name && f.name.trim() !== '') {
      whereClauses.push(like(aiAgents.name, `%${f.name}%`));
    }
    if (f.version && f.version.trim() !== '') {
      whereClauses.push(like(aiAgents.version, `%${f.version}%`));
    }

    const rows = await orm
      .select({
        id: aiAgents.id,
        code: aiAgents.code,
        name: aiAgents.name,
        description: aiAgents.description,
        version: aiAgents.version,
        enable: aiAgents.enable,
        isSystem: aiAgents.isSystem,
        systemPrompt: aiAgents.systemPrompt,
        configuration: aiAgents.configuration,
        modelId: aiAgents.modelId,
        createdAt: aiAgents.createdAt,
        updatedAt: aiAgents.updatedAt,
        model: {
          id: aiModels.id,
          name: aiModels.name,
          code: aiModels.code,
        },
        provider: {
          id: aiProviders.id,
          name: aiProviders.name,
          code: aiProviders.code,
        },
      })
      .from(aiAgents)
      .leftJoin(aiModels, eq(aiAgents.modelId, aiModels.id))
      .leftJoin(aiProviders, eq(aiModels.providerId, aiProviders.id))
      .where(whereClauses.length ? and(...whereClauses) : undefined)
      .orderBy(aiAgents.name);
    return rows;
  });

  ipcMain.handle('db:admin:agents:insert', async (_evt, payload: AgentInsert) => {
    const orm = await getOrm();
    const now = new Date();
    const values = {
      code: payload.code,
      name: payload.name,
      description: payload.description ?? '',
      version: payload.version ?? '1.0',
      enable: payload.enable ?? true,
      isSystem: payload.isSystem ?? false,
      systemPrompt: payload.systemPrompt ?? null,
      configuration: payload.configuration ?? '{}',
      modelId: payload.modelId,
      createdAt: now,
      updatedAt: now,
    } as const;
    const res = await orm.insert(aiAgents).values(values).returning();
    saveDatabase();
    return res[0] ?? null;
  });

  ipcMain.handle('db:admin:agents:update', async (_evt, payload: AgentUpdate) => {
    const orm = await getOrm();
    const { id, ...updates } = payload;
    const res = await orm
      .update(aiAgents)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(aiAgents.id, id))
      .returning();
    saveDatabase();
    return res[0] ?? null;
  });

  ipcMain.handle('db:admin:agents:delete', async (_evt, id: number) => {
    const orm = await getOrm();
    await orm.delete(aiAgents).where(eq(aiAgents.id, id));
    saveDatabase();
    return { ok: true } as const;
  });
}


