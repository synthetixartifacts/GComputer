import express from 'express';
import cors from 'cors';
import { testService, providerService, modelService, agentService } from './db/services/index.js';
import type {
  TestFilters,
  TestInsert, 
  TestUpdate,
  ProviderFilters,
  ProviderInsert,
  ProviderUpdate,
  ModelFilters,
  ModelInsert,
  ModelUpdate,
  AgentFilters,
  AgentInsert,
  AgentUpdate,
} from './db/types.js';
import { 
  asyncHandler, 
  parseIdParam, 
  parseLimitQuery,
  type IdParam,
  type DiscussionIdParam,
  type LimitQuery,
  type HealthResponse,
  type ErrorResponse,
  type CountResponse
} from './api-types.js';

/**
 * REST API Server for browser-based database management
 * Shares the same service layer and database file as Electron app
 */

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());


// Health check
app.get<{}, HealthResponse>('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test table endpoints
app.get('/api/test', asyncHandler<{}, TestFilters>(async (req, res) => {
  const filters: TestFilters = req.query;
  const rows = await testService.list(filters);
  res.json(rows);
}));

app.post('/api/test', asyncHandler<{}, {}, TestInsert>(async (req, res) => {
  const payload: TestInsert = req.body;
  const result = await testService.insert(payload);
  res.status(201).json(result);
}));

app.put('/api/test/:id', asyncHandler<IdParam, {}, Omit<TestUpdate, 'id'>>(async (req, res) => {
  const id = parseIdParam(req.params.id);
  const payload: TestUpdate = { id, ...req.body };
  const result = await testService.update(payload);
  res.json(result);
}));

app.delete('/api/test/:id', asyncHandler<IdParam>(async (req, res) => {
  const id = parseIdParam(req.params.id);
  const result = await testService.delete(id);
  res.json(result);
}));

app.delete('/api/test', asyncHandler(async (req, res) => {
  const result = await testService.truncate();
  res.json(result);
}));

// Provider endpoints
app.get('/api/admin/providers', asyncHandler<{}, ProviderFilters>(async (req, res) => {
  const filters: ProviderFilters = req.query;
  const rows = await providerService.list(filters);
  res.json(rows);
}));

app.post('/api/admin/providers', asyncHandler<{}, {}, ProviderInsert>(async (req, res) => {
  const payload: ProviderInsert = req.body;
  const result = await providerService.insert(payload);
  res.status(201).json(result);
}));

app.put('/api/admin/providers/:id', asyncHandler<IdParam, {}, Omit<ProviderUpdate, 'id'>>(async (req, res) => {
  const id = parseIdParam(req.params.id);
  const payload: ProviderUpdate = { id, ...req.body };
  const result = await providerService.update(payload);
  res.json(result);
}));

app.delete('/api/admin/providers/:id', asyncHandler<IdParam>(async (req, res) => {
  const id = parseIdParam(req.params.id);
  const result = await providerService.delete(id);
  res.json(result);
}));

// Model endpoints
app.get('/api/admin/models', asyncHandler<{}, ModelFilters>(async (req, res) => {
  const filters: ModelFilters = req.query;
  const rows = await modelService.list(filters);
  res.json(rows);
}));

app.post('/api/admin/models', asyncHandler<{}, {}, ModelInsert>(async (req, res) => {
  const payload: ModelInsert = req.body;
  const result = await modelService.insert(payload);
  res.status(201).json(result);
}));

app.put('/api/admin/models/:id', asyncHandler<IdParam, {}, Omit<ModelUpdate, 'id'>>(async (req, res) => {
  const id = parseIdParam(req.params.id);
  const payload: ModelUpdate = { id, ...req.body };
  const result = await modelService.update(payload);
  res.json(result);
}));

app.delete('/api/admin/models/:id', asyncHandler<IdParam>(async (req, res) => {
  const id = parseIdParam(req.params.id);
  const result = await modelService.delete(id);
  res.json(result);
}));

// Agent endpoints
app.get('/api/admin/agents', asyncHandler<{}, AgentFilters>(async (req, res) => {
  const filters: AgentFilters = req.query;
  const rows = await agentService.list(filters);
  res.json(rows);
}));

app.post('/api/admin/agents', asyncHandler<{}, {}, AgentInsert>(async (req, res) => {
  const payload: AgentInsert = req.body;
  const result = await agentService.insert(payload);
  res.status(201).json(result);
}));

app.put('/api/admin/agents/:id', asyncHandler<IdParam, {}, Omit<AgentUpdate, 'id'>>(async (req, res) => {
  const id = parseIdParam(req.params.id);
  const payload: AgentUpdate = { id, ...req.body };
  const result = await agentService.update(payload);
  res.json(result);
}));

app.delete('/api/admin/agents/:id', asyncHandler<IdParam>(async (req, res) => {
  const id = parseIdParam(req.params.id);
  const result = await agentService.delete(id);
  res.json(result);
}));

// Discussion endpoints
app.get('/api/discussions', asyncHandler(async (req, res) => {
  const { discussionService } = await import('./db/services/discussion-service.js');
  const result = await discussionService.list(req.query as any);
  res.json(result);
}));

app.post('/api/discussions', asyncHandler(async (req, res) => {
  const { discussionService } = await import('./db/services/discussion-service.js');
  const result = await discussionService.create(req.body as any);
  res.status(201).json(result);
}));

app.put('/api/discussions/:id', asyncHandler<IdParam>(async (req, res) => {
  const { discussionService } = await import('./db/services/discussion-service.js');
  const id = parseIdParam(req.params.id);
  const result = await discussionService.update({ ...(req.body as any), id });
  res.json(result);
}));

app.delete('/api/discussions/:id', asyncHandler<IdParam>(async (req, res) => {
  const { discussionService } = await import('./db/services/discussion-service.js');
  const id = parseIdParam(req.params.id);
  const result = await discussionService.delete(id);
  res.json(result);
}));

app.get('/api/discussions/:id/with-messages', asyncHandler<IdParam>(async (req, res) => {
  const { discussionService } = await import('./db/services/discussion-service.js');
  const id = parseIdParam(req.params.id);
  const result = await discussionService.getWithMessages(id);
  res.json(result);
}));

app.post('/api/discussions/:id/favorite', asyncHandler<IdParam>(async (req, res) => {
  const { discussionService } = await import('./db/services/discussion-service.js');
  const id = parseIdParam(req.params.id);
  const result = await discussionService.toggleFavorite(id);
  res.json(result);
}));

// Message endpoints
app.get('/api/messages', asyncHandler(async (req, res) => {
  const { messageService } = await import('./db/services/message-service.js');
  const result = await messageService.list(req.query as any);
  res.json(result);
}));

app.post('/api/messages', asyncHandler(async (req, res) => {
  const { messageService } = await import('./db/services/message-service.js');
  const result = await messageService.createForDiscussion(req.body as any);
  res.status(201).json(result);
}));

app.get('/api/messages/discussion/:discussionId', asyncHandler<DiscussionIdParam>(async (req, res) => {
  const { messageService } = await import('./db/services/message-service.js');
  const discussionId = parseIdParam(req.params.discussionId);
  const result = await messageService.getByDiscussion(discussionId);
  res.json(result);
}));

app.get('/api/messages/discussion/:discussionId/last', asyncHandler<DiscussionIdParam, LimitQuery>(async (req, res) => {
  const { messageService } = await import('./db/services/message-service.js');
  const discussionId = parseIdParam(req.params.discussionId);
  const limit = parseLimitQuery(req.query.limit);
  const result = await messageService.getLastMessages(discussionId, limit);
  res.json(result);
}));

app.get('/api/messages/discussion/:discussionId/count', asyncHandler<DiscussionIdParam, {}, {}, CountResponse>(async (req, res) => {
  const { messageService } = await import('./db/services/message-service.js');
  const discussionId = parseIdParam(req.params.discussionId);
  const result = await messageService.countByDiscussion(discussionId);
  res.json({ count: result });
}));

app.delete('/api/messages/discussion/:discussionId', asyncHandler<DiscussionIdParam>(async (req, res) => {
  const { messageService } = await import('./db/services/message-service.js');
  const discussionId = parseIdParam(req.params.discussionId);
  const result = await messageService.deleteByDiscussion(discussionId);
  res.json(result);
}));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response<ErrorResponse>, next: express.NextFunction) => {
  console.error('[API Server Error]:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response<ErrorResponse>) => {
  res.status(404).json({ 
    error: 'Not found', 
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

export function startApiServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      console.log(`[API Server] Running on http://localhost:${PORT}`);
      console.log(`[API Server] Health check: http://localhost:${PORT}/api/health`);
      resolve();
    });

    server.on('error', (err) => {
      console.error('[API Server] Failed to start:', err);
      reject(err);
    });
  });
}

export default app;