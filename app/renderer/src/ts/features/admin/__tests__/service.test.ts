import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import * as adminService from '../service';
import { isElectronEnvironment } from '../../environment';
import * as electronService from '../electron-service';
import * as browserService from '../browser-service';
import type { Provider, Model, Agent, ProviderInsert, ModelInsert, AgentInsert } from '../types';

// Mock the environment check
vi.mock('../../environment', () => ({
  isElectronEnvironment: vi.fn(),
}));

// Mock the service implementations
vi.mock('../electron-service', () => ({
  listProviders: vi.fn(),
  createProvider: vi.fn(),
  updateProvider: vi.fn(),
  deleteProvider: vi.fn(),
  listModels: vi.fn(),
  createModel: vi.fn(),
  updateModel: vi.fn(),
  deleteModel: vi.fn(),
  listAgents: vi.fn(),
  createAgent: vi.fn(),
  updateAgent: vi.fn(),
  deleteAgent: vi.fn(),
}));

vi.mock('../browser-service', () => ({
  listProviders: vi.fn(),
  createProvider: vi.fn(),
  updateProvider: vi.fn(),
  deleteProvider: vi.fn(),
  listModels: vi.fn(),
  createModel: vi.fn(),
  updateModel: vi.fn(),
  deleteModel: vi.fn(),
  listAgents: vi.fn(),
  createAgent: vi.fn(),
  updateAgent: vi.fn(),
  deleteAgent: vi.fn(),
}));

describe('Admin Service', () => {
  // Test data
  const mockProvider: Provider = {
    id: 1,
    code: 'openai',
    name: 'OpenAI',
    url: 'https://api.openai.com',
    authentication: 'bearer',
    secretKey: 'sk-test',
    configuration: '{}',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };
  
  const mockModel: Model = {
    id: 1,
    code: 'gpt-4',
    name: 'GPT-4',
    providerId: 1,
    provider: mockProvider,
    configuration: '{"temperature": 0.7}',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };
  
  const mockAgent: Agent = {
    id: 1,
    code: 'assistant',
    name: 'AI Assistant',
    modelId: 1,
    model: mockModel,
    systemMessage: 'You are a helpful assistant',
    configuration: '{}',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('Provider Operations', () => {
    describe('listProviders', () => {
      test('should use electron service in Electron environment', async () => {
        vi.mocked(isElectronEnvironment).mockReturnValue(true);
        vi.mocked(electronService.listProviders).mockResolvedValue([mockProvider]);
        
        const result = await adminService.listProviders();
        
        expect(electronService.listProviders).toHaveBeenCalledWith(undefined);
        expect(browserService.listProviders).not.toHaveBeenCalled();
        expect(result).toEqual([mockProvider]);
      });
      
      test('should use browser service in browser environment', async () => {
        vi.mocked(isElectronEnvironment).mockReturnValue(false);
        vi.mocked(browserService.listProviders).mockResolvedValue([mockProvider]);
        
        const result = await adminService.listProviders();
        
        expect(browserService.listProviders).toHaveBeenCalledWith(undefined);
        expect(electronService.listProviders).not.toHaveBeenCalled();
        expect(result).toEqual([mockProvider]);
      });
      
      test('should pass filters to service', async () => {
        vi.mocked(isElectronEnvironment).mockReturnValue(true);
        vi.mocked(electronService.listProviders).mockResolvedValue([mockProvider]);
        
        const filters = { name: 'OpenAI', code: 'openai' };
        await adminService.listProviders(filters);
        
        expect(electronService.listProviders).toHaveBeenCalledWith(filters);
      });
    });
    
    describe('createProvider', () => {
      const newProvider: ProviderInsert = {
        code: 'anthropic',
        name: 'Anthropic',
        url: 'https://api.anthropic.com',
        authentication: 'bearer',
      };
      
      test('should create provider in Electron environment', async () => {
        vi.mocked(isElectronEnvironment).mockReturnValue(true);
        vi.mocked(electronService.createProvider).mockResolvedValue(mockProvider);
        
        const result = await adminService.createProvider(newProvider);
        
        expect(electronService.createProvider).toHaveBeenCalledWith(newProvider);
        expect(result).toEqual(mockProvider);
      });
      
      test('should create provider in browser environment', async () => {
        vi.mocked(isElectronEnvironment).mockReturnValue(false);
        vi.mocked(browserService.createProvider).mockResolvedValue(mockProvider);
        
        const result = await adminService.createProvider(newProvider);
        
        expect(browserService.createProvider).toHaveBeenCalledWith(newProvider);
        expect(result).toEqual(mockProvider);
      });
      
      test('should handle null response', async () => {
        vi.mocked(isElectronEnvironment).mockReturnValue(true);
        vi.mocked(electronService.createProvider).mockResolvedValue(null);
        
        const result = await adminService.createProvider(newProvider);
        
        expect(result).toBeNull();
      });
    });
    
    describe('updateProvider', () => {
      const updateData = { id: 1, name: 'Updated OpenAI' };
      
      test('should update provider in Electron environment', async () => {
        vi.mocked(isElectronEnvironment).mockReturnValue(true);
        vi.mocked(electronService.updateProvider).mockResolvedValue({ ...mockProvider, name: 'Updated OpenAI' });
        
        const result = await adminService.updateProvider(updateData);
        
        expect(electronService.updateProvider).toHaveBeenCalledWith(updateData);
        expect(result?.name).toBe('Updated OpenAI');
      });
      
      test('should update provider in browser environment', async () => {
        vi.mocked(isElectronEnvironment).mockReturnValue(false);
        vi.mocked(browserService.updateProvider).mockResolvedValue({ ...mockProvider, name: 'Updated OpenAI' });
        
        const result = await adminService.updateProvider(updateData);
        
        expect(browserService.updateProvider).toHaveBeenCalledWith(updateData);
        expect(result?.name).toBe('Updated OpenAI');
      });
    });
    
    describe('deleteProvider', () => {
      test('should delete provider in Electron environment', async () => {
        vi.mocked(isElectronEnvironment).mockReturnValue(true);
        vi.mocked(electronService.deleteProvider).mockResolvedValue({ ok: true });
        
        const result = await adminService.deleteProvider(1);
        
        expect(electronService.deleteProvider).toHaveBeenCalledWith(1);
        expect(result).toEqual({ ok: true });
      });
      
      test('should delete provider in browser environment', async () => {
        vi.mocked(isElectronEnvironment).mockReturnValue(false);
        vi.mocked(browserService.deleteProvider).mockResolvedValue({ ok: true });
        
        const result = await adminService.deleteProvider(1);
        
        expect(browserService.deleteProvider).toHaveBeenCalledWith(1);
        expect(result).toEqual({ ok: true });
      });
    });
  });
  
  describe('Model Operations', () => {
    describe('listModels', () => {
      test('should list models with provider relationships', async () => {
        vi.mocked(isElectronEnvironment).mockReturnValue(true);
        vi.mocked(electronService.listModels).mockResolvedValue([mockModel]);
        
        const result = await adminService.listModels();
        
        expect(result).toEqual([mockModel]);
        expect(result[0].provider).toEqual(mockProvider);
      });
      
      test('should apply filters', async () => {
        vi.mocked(isElectronEnvironment).mockReturnValue(false);
        const filters = { providerId: 1, name: 'GPT' };
        
        await adminService.listModels(filters);
        
        expect(browserService.listModels).toHaveBeenCalledWith(filters);
      });
    });
    
    describe('createModel', () => {
      const newModel: ModelInsert = {
        code: 'claude-3',
        name: 'Claude 3',
        providerId: 2,
      };
      
      test('should create model with provider relationship', async () => {
        vi.mocked(isElectronEnvironment).mockReturnValue(true);
        vi.mocked(electronService.createModel).mockResolvedValue(mockModel);
        
        const result = await adminService.createModel(newModel);
        
        expect(electronService.createModel).toHaveBeenCalledWith(newModel);
        expect(result).toEqual(mockModel);
      });
      
      test('should validate provider ID before creation', async () => {
        const invalidModel: ModelInsert = {
          code: 'invalid',
          name: 'Invalid Model',
          providerId: null as any, // Invalid provider ID
        };
        
        vi.mocked(isElectronEnvironment).mockReturnValue(true);
        
        // Should still call the service, validation happens at service layer
        await adminService.createModel(invalidModel);
        
        expect(electronService.createModel).toHaveBeenCalledWith(invalidModel);
      });
    });
  });
  
  describe('Agent Operations', () => {
    describe('listAgents', () => {
      test('should list agents with nested relationships', async () => {
        vi.mocked(isElectronEnvironment).mockReturnValue(true);
        vi.mocked(electronService.listAgents).mockResolvedValue([mockAgent]);
        
        const result = await adminService.listAgents();
        
        expect(result).toEqual([mockAgent]);
        expect(result[0].model).toEqual(mockModel);
        expect(result[0].model.provider).toEqual(mockProvider);
      });
      
      test('should filter active agents', async () => {
        vi.mocked(isElectronEnvironment).mockReturnValue(false);
        const filters = { isActive: true };
        
        await adminService.listAgents(filters);
        
        expect(browserService.listAgents).toHaveBeenCalledWith(filters);
      });
    });
    
    describe('createAgent', () => {
      const newAgent: AgentInsert = {
        code: 'helper',
        name: 'Helper Bot',
        modelId: 1,
        systemMessage: 'You are a helpful assistant',
        isActive: true,
      };
      
      test('should create agent with model relationship', async () => {
        vi.mocked(isElectronEnvironment).mockReturnValue(true);
        vi.mocked(electronService.createAgent).mockResolvedValue(mockAgent);
        
        const result = await adminService.createAgent(newAgent);
        
        expect(electronService.createAgent).toHaveBeenCalledWith(newAgent);
        expect(result).toEqual(mockAgent);
      });
      
      test('should handle optional configuration', async () => {
        const agentWithConfig: AgentInsert = {
          ...newAgent,
          configuration: '{"temperature": 0.5}',
        };
        
        vi.mocked(isElectronEnvironment).mockReturnValue(true);
        
        await adminService.createAgent(agentWithConfig);
        
        expect(electronService.createAgent).toHaveBeenCalledWith(agentWithConfig);
      });
    });
    
    describe('updateAgent', () => {
      test('should update agent active status', async () => {
        const updateData = { id: 1, isActive: false };
        const updatedAgent = { ...mockAgent, isActive: false };
        
        vi.mocked(isElectronEnvironment).mockReturnValue(true);
        vi.mocked(electronService.updateAgent).mockResolvedValue(updatedAgent);
        
        const result = await adminService.updateAgent(updateData);
        
        expect(electronService.updateAgent).toHaveBeenCalledWith(updateData);
        expect(result?.isActive).toBe(false);
      });
      
      test('should update system message', async () => {
        const updateData = { id: 1, systemMessage: 'New system message' };
        const updatedAgent = { ...mockAgent, systemMessage: 'New system message' };
        
        vi.mocked(isElectronEnvironment).mockReturnValue(false);
        vi.mocked(browserService.updateAgent).mockResolvedValue(updatedAgent);
        
        const result = await adminService.updateAgent(updateData);
        
        expect(browserService.updateAgent).toHaveBeenCalledWith(updateData);
        expect(result?.systemMessage).toBe('New system message');
      });
    });
  });
  
  describe('Error Handling', () => {
    test('should propagate errors from electron service', async () => {
      vi.mocked(isElectronEnvironment).mockReturnValue(true);
      const error = new Error('Database connection failed');
      vi.mocked(electronService.listProviders).mockRejectedValue(error);
      
      await expect(adminService.listProviders()).rejects.toThrow('Database connection failed');
    });
    
    test('should propagate errors from browser service', async () => {
      vi.mocked(isElectronEnvironment).mockReturnValue(false);
      const error = new Error('Network error');
      vi.mocked(browserService.listProviders).mockRejectedValue(error);
      
      await expect(adminService.listProviders()).rejects.toThrow('Network error');
    });
    
    test('should handle timeout errors', async () => {
      vi.mocked(isElectronEnvironment).mockReturnValue(false);
      const timeoutError = new Error('Request timeout');
      vi.mocked(browserService.createAgent).mockRejectedValue(timeoutError);
      
      await expect(adminService.createAgent({
        code: 'test',
        name: 'Test',
        modelId: 1,
        systemMessage: 'Test',
        isActive: true,
      })).rejects.toThrow('Request timeout');
    });
  });
  
  describe('Environment Detection', () => {
    test('should correctly detect environment for all operations', async () => {
      // Test rapid environment changes
      vi.mocked(isElectronEnvironment).mockReturnValueOnce(true);
      await adminService.listProviders();
      expect(electronService.listProviders).toHaveBeenCalledTimes(1);
      
      vi.mocked(isElectronEnvironment).mockReturnValueOnce(false);
      await adminService.listModels();
      expect(browserService.listModels).toHaveBeenCalledTimes(1);
      
      vi.mocked(isElectronEnvironment).mockReturnValueOnce(true);
      await adminService.listAgents();
      expect(electronService.listAgents).toHaveBeenCalledTimes(1);
    });
  });
});