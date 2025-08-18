import { describe, test, expect, beforeEach, vi } from 'vitest';
import { registerAdminHandlers } from '../admin-handlers';
import { ipcMain } from 'electron';
import { providerService, modelService, agentService } from '../../services';
import type { 
  ProviderFilters, 
  ProviderInsert, 
  ProviderUpdate,
  ModelFilters,
  ModelInsert,
  ModelUpdate,
  AgentFilters,
  AgentInsert,
  AgentUpdate
} from '../types.js';

// Mock Electron IPC
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

// Mock the services
vi.mock('../../services', () => ({
  providerService: {
    list: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  modelService: {
    list: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  agentService: {
    list: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Admin IPC Handlers', () => {
  let mockHandlers: Map<string, Function>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHandlers = new Map();

    // Capture IPC handlers
    vi.mocked(ipcMain.handle).mockImplementation((channel: string, handler: Function) => {
      mockHandlers.set(channel, handler);
    });

    // Register handlers
    registerAdminHandlers();
  });

  // Helper to simulate IPC call
  const invokeHandler = async (channel: string, ...args: any[]) => {
    const handler = mockHandlers.get(channel);
    if (!handler) {
      throw new Error(`No handler registered for channel: ${channel}`);
    }
    return handler({}, ...args);
  };

  describe('Provider Handlers', () => {
    const mockProviders = [
      {
        id: 1,
        code: 'openai',
        name: 'OpenAI',
        url: 'https://api.openai.com',
        authentication: 'bearer',
        secretKey: 'sk-test',
        configuration: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        code: 'anthropic',
        name: 'Anthropic',
        url: 'https://api.anthropic.com',
        authentication: 'bearer',
        secretKey: 'sk-ant-test',
        configuration: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    test('should register providers list handler', () => {
      expect(mockHandlers.has('db:admin:providers:list')).toBe(true);
    });

    test('should handle providers list without filters', async () => {
      vi.mocked(providerService.list).mockResolvedValue(mockProviders);

      const result = await invokeHandler('db:admin:providers:list');

      expect(providerService.list).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockProviders);
    });

    test('should handle providers list with filters', async () => {
      const filters: ProviderFilters = { code: 'openai' };
      const filteredProviders = [mockProviders[0]];
      vi.mocked(providerService.list).mockResolvedValue(filteredProviders);

      const result = await invokeHandler('db:admin:providers:list', filters);

      expect(providerService.list).toHaveBeenCalledWith(filters);
      expect(result).toEqual(filteredProviders);
    });

    test('should handle provider insertion', async () => {
      const insertData: ProviderInsert = {
        code: 'test-provider',
        name: 'Test Provider',
        url: 'https://api.test.com',
        authentication: 'bearer',
      };
      const insertedProvider = { id: 3, ...insertData };
      vi.mocked(providerService.insert).mockResolvedValue(insertedProvider);

      const result = await invokeHandler('db:admin:providers:insert', insertData);

      expect(providerService.insert).toHaveBeenCalledWith(insertData);
      expect(result).toEqual(insertedProvider);
    });

    test('should handle provider updates', async () => {
      const updateData: ProviderUpdate = {
        id: 1,
        name: 'Updated OpenAI',
      };
      const updatedProvider = { ...mockProviders[0], ...updateData };
      vi.mocked(providerService.update).mockResolvedValue(updatedProvider);

      const result = await invokeHandler('db:admin:providers:update', updateData);

      expect(providerService.update).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(updatedProvider);
    });

    test('should handle provider deletion', async () => {
      const deleteResult = { ok: true };
      vi.mocked(providerService.delete).mockResolvedValue(deleteResult);

      const result = await invokeHandler('db:admin:providers:delete', 1);

      expect(providerService.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(deleteResult);
    });

    test('should handle provider service errors', async () => {
      const error = new Error('Provider service error');
      vi.mocked(providerService.list).mockRejectedValue(error);

      await expect(invokeHandler('db:admin:providers:list'))
        .rejects.toThrow('Provider service error');
    });
  });

  describe('Model Handlers', () => {
    const mockModels = [
      {
        id: 1,
        code: 'gpt-4',
        name: 'GPT-4',
        providerId: 1,
        configuration: '{"temperature": 0.7}',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        code: 'claude-3',
        name: 'Claude 3',
        providerId: 2,
        configuration: '{"temperature": 0.5}',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    test('should register all model handlers', () => {
      expect(mockHandlers.has('db:admin:models:list')).toBe(true);
      expect(mockHandlers.has('db:admin:models:insert')).toBe(true);
      expect(mockHandlers.has('db:admin:models:update')).toBe(true);
      expect(mockHandlers.has('db:admin:models:delete')).toBe(true);
    });

    test('should handle models list', async () => {
      vi.mocked(modelService.list).mockResolvedValue(mockModels);

      const result = await invokeHandler('db:admin:models:list');

      expect(modelService.list).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockModels);
    });

    test('should handle models list with filters', async () => {
      const filters: ModelFilters = { providerId: 1 };
      const filteredModels = [mockModels[0]];
      vi.mocked(modelService.list).mockResolvedValue(filteredModels);

      const result = await invokeHandler('db:admin:models:list', filters);

      expect(modelService.list).toHaveBeenCalledWith(filters);
      expect(result).toEqual(filteredModels);
    });

    test('should handle model insertion', async () => {
      const insertData: ModelInsert = {
        code: 'test-model',
        name: 'Test Model',
        providerId: 1,
      };
      const insertedModel = { id: 3, ...insertData };
      vi.mocked(modelService.insert).mockResolvedValue(insertedModel);

      const result = await invokeHandler('db:admin:models:insert', insertData);

      expect(modelService.insert).toHaveBeenCalledWith(insertData);
      expect(result).toEqual(insertedModel);
    });

    test('should handle model updates', async () => {
      const updateData: ModelUpdate = {
        id: 1,
        name: 'Updated GPT-4',
        configuration: '{"temperature": 0.9}',
      };
      const updatedModel = { ...mockModels[0], ...updateData };
      vi.mocked(modelService.update).mockResolvedValue(updatedModel);

      const result = await invokeHandler('db:admin:models:update', updateData);

      expect(modelService.update).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(updatedModel);
    });

    test('should handle model deletion', async () => {
      const deleteResult = { ok: true };
      vi.mocked(modelService.delete).mockResolvedValue(deleteResult);

      const result = await invokeHandler('db:admin:models:delete', 1);

      expect(modelService.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(deleteResult);
    });
  });

  describe('Agent Handlers', () => {
    const mockAgents = [
      {
        id: 1,
        code: 'assistant',
        name: 'AI Assistant',
        modelId: 1,
        systemMessage: 'You are a helpful assistant',
        configuration: '{}',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        code: 'translator',
        name: 'Translator',
        modelId: 2,
        systemMessage: 'You are a professional translator',
        configuration: '{}',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    test('should register all agent handlers', () => {
      expect(mockHandlers.has('db:admin:agents:list')).toBe(true);
      expect(mockHandlers.has('db:admin:agents:insert')).toBe(true);
      expect(mockHandlers.has('db:admin:agents:update')).toBe(true);
      expect(mockHandlers.has('db:admin:agents:delete')).toBe(true);
    });

    test('should handle agents list', async () => {
      vi.mocked(agentService.list).mockResolvedValue(mockAgents);

      const result = await invokeHandler('db:admin:agents:list');

      expect(agentService.list).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockAgents);
    });

    test('should handle agents list with filters', async () => {
      const filters: AgentFilters = { isActive: true };
      const activeAgents = [mockAgents[0]];
      vi.mocked(agentService.list).mockResolvedValue(activeAgents);

      const result = await invokeHandler('db:admin:agents:list', filters);

      expect(agentService.list).toHaveBeenCalledWith(filters);
      expect(result).toEqual(activeAgents);
    });

    test('should handle agent insertion', async () => {
      const insertData: AgentInsert = {
        code: 'test-agent',
        name: 'Test Agent',
        modelId: 1,
        systemMessage: 'You are a test agent',
        isActive: true,
      };
      const insertedAgent = { id: 3, ...insertData };
      vi.mocked(agentService.insert).mockResolvedValue(insertedAgent);

      const result = await invokeHandler('db:admin:agents:insert', insertData);

      expect(agentService.insert).toHaveBeenCalledWith(insertData);
      expect(result).toEqual(insertedAgent);
    });

    test('should handle agent updates', async () => {
      const updateData: AgentUpdate = {
        id: 1,
        systemMessage: 'Updated system message',
        isActive: false,
      };
      const updatedAgent = { ...mockAgents[0], ...updateData };
      vi.mocked(agentService.update).mockResolvedValue(updatedAgent);

      const result = await invokeHandler('db:admin:agents:update', updateData);

      expect(agentService.update).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(updatedAgent);
    });

    test('should handle agent deletion', async () => {
      const deleteResult = { ok: true };
      vi.mocked(agentService.delete).mockResolvedValue(deleteResult);

      const result = await invokeHandler('db:admin:agents:delete', 1);

      expect(agentService.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(deleteResult);
    });

    test('should handle agent service errors', async () => {
      const error = new Error('Agent not found');
      vi.mocked(agentService.delete).mockRejectedValue(error);

      await expect(invokeHandler('db:admin:agents:delete', 999))
        .rejects.toThrow('Agent not found');
    });
  });

  describe('Handler Registration', () => {
    test('should register all required handlers', () => {
      const expectedHandlers = [
        // Provider handlers
        'db:admin:providers:list',
        'db:admin:providers:insert',
        'db:admin:providers:update',
        'db:admin:providers:delete',
        // Model handlers
        'db:admin:models:list',
        'db:admin:models:insert',
        'db:admin:models:update',
        'db:admin:models:delete',
        // Agent handlers
        'db:admin:agents:list',
        'db:admin:agents:insert',
        'db:admin:agents:update',
        'db:admin:agents:delete',
      ];

      for (const channel of expectedHandlers) {
        expect(mockHandlers.has(channel)).toBe(true);
      }

      expect(mockHandlers.size).toBe(expectedHandlers.length);
    });

    test('should register handlers with ipcMain.handle', () => {
      expect(ipcMain.handle).toHaveBeenCalledTimes(12); // 4 per entity type × 3 entity types
    });
  });

  describe('Error Handling', () => {
    test('should propagate service errors to IPC calls', async () => {
      const serviceError = new Error('Database connection failed');
      vi.mocked(providerService.list).mockRejectedValue(serviceError);

      await expect(invokeHandler('db:admin:providers:list'))
        .rejects.toThrow('Database connection failed');
    });

    test('should handle validation errors', async () => {
      const validationError = new Error('Invalid provider data');
      vi.mocked(providerService.insert).mockRejectedValue(validationError);

      await expect(invokeHandler('db:admin:providers:insert', {}))
        .rejects.toThrow('Invalid provider data');
    });

    test('should handle constraint violations', async () => {
      const constraintError = new Error('Unique constraint violation');
      vi.mocked(modelService.insert).mockRejectedValue(constraintError);

      await expect(invokeHandler('db:admin:models:insert', {
        code: 'duplicate',
        name: 'Duplicate Model',
        providerId: 1,
      })).rejects.toThrow('Unique constraint violation');
    });
  });

  describe('Data Type Handling', () => {
    test('should handle complex filter objects', async () => {
      const complexFilters: ModelFilters = {
        providerId: 1,
        code: 'gpt',
        name: 'GPT',
      };

      vi.mocked(modelService.list).mockResolvedValue([]);

      await invokeHandler('db:admin:models:list', complexFilters);

      expect(modelService.list).toHaveBeenCalledWith(complexFilters);
    });

    test('should handle partial update objects', async () => {
      const partialUpdate: AgentUpdate = {
        id: 1,
        isActive: false,
        // Only updating isActive field
      };

      vi.mocked(agentService.update).mockResolvedValue(null);

      await invokeHandler('db:admin:agents:update', partialUpdate);

      expect(agentService.update).toHaveBeenCalledWith(partialUpdate);
    });

    test('should handle JSON configuration strings', async () => {
      const insertData: ModelInsert = {
        code: 'test-model',
        name: 'Test Model',
        providerId: 1,
        configuration: '{"temperature": 0.7, "maxTokens": 1000}',
      };

      vi.mocked(modelService.insert).mockResolvedValue({ id: 1, ...insertData });

      await invokeHandler('db:admin:models:insert', insertData);

      expect(modelService.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          configuration: '{"temperature": 0.7, "maxTokens": 1000}',
        })
      );
    });
  });

  describe('Concurrent Request Handling', () => {
    test('should handle multiple concurrent list requests', async () => {
      vi.mocked(providerService.list).mockResolvedValue([]);
      vi.mocked(modelService.list).mockResolvedValue([]);
      vi.mocked(agentService.list).mockResolvedValue([]);

      const promises = [
        invokeHandler('db:admin:providers:list'),
        invokeHandler('db:admin:models:list'),
        invokeHandler('db:admin:agents:list'),
      ];

      await Promise.all(promises);

      expect(providerService.list).toHaveBeenCalledTimes(1);
      expect(modelService.list).toHaveBeenCalledTimes(1);
      expect(agentService.list).toHaveBeenCalledTimes(1);
    });

    test('should handle concurrent CRUD operations', async () => {
      vi.mocked(providerService.insert).mockResolvedValue({ id: 1 } as any);
      vi.mocked(modelService.update).mockResolvedValue({ id: 1 } as any);
      vi.mocked(agentService.delete).mockResolvedValue({ ok: true });

      const promises = [
        invokeHandler('db:admin:providers:insert', { code: 'test', name: 'Test', url: 'test.com', authentication: 'bearer' }),
        invokeHandler('db:admin:models:update', { id: 1, name: 'Updated' }),
        invokeHandler('db:admin:agents:delete', 1),
      ];

      await Promise.all(promises);

      expect(providerService.insert).toHaveBeenCalledTimes(1);
      expect(modelService.update).toHaveBeenCalledTimes(1);
      expect(agentService.delete).toHaveBeenCalledTimes(1);
    });
  });
});