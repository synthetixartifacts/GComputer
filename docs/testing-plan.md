# GComputer Unit Testing Implementation Plan

## Executive Summary

This document outlines a comprehensive unit testing strategy for the GComputer application, an Electron desktop app with TypeScript, Svelte 5, and SQLite. The plan focuses on establishing a robust testing infrastructure that ensures code quality, prevents regressions, and maintains the exceptional architecture already in place.

## Current State Analysis

### No Testing Infrastructure
- No test frameworks installed
- No test scripts configured
- No existing test files
- High-quality codebase ready for testing

### Architecture Strengths to Leverage
- **Clear separation of concerns**: Main/Preload/Renderer processes
- **Feature-based organization**: Each feature has service, store, and types
- **Service layer pattern**: Shared business logic between Electron and REST API
- **Type safety**: Strict TypeScript throughout
- **Component isolation**: Svelte components with minimal logic

## Testing Framework Selection

### Core Testing Stack

#### 1. **Vitest** (Primary Test Runner)
- **Why**: Native Vite integration, excellent TypeScript support, fast execution
- **Use for**: All unit tests, integration tests, and component tests
- **Benefits**: Same config as Vite, HMR for tests, compatible with Jest APIs

#### 2. **@testing-library/svelte** (Component Testing)
- **Why**: Official Svelte testing utilities, promotes testing best practices
- **Use for**: Svelte component unit tests
- **Benefits**: User-centric testing approach, great Svelte 5 support

#### 3. **@vitest/ui** (Test UI)
- **Why**: Beautiful UI for test exploration and debugging
- **Use for**: Development test running and debugging
- **Benefits**: Visual test results, coverage reports, test filtering

#### 4. **c8** (Coverage Tool)
- **Why**: Native V8 coverage, works perfectly with Vitest
- **Use for**: Code coverage reports
- **Benefits**: Accurate coverage, minimal overhead

#### 5. **msw** (Mock Service Worker)
- **Why**: API mocking for integration tests
- **Use for**: Testing API-dependent features without real backends
- **Benefits**: Intercepts requests at network level, works in Node and browser

#### 6. **@electron/test** (Electron Testing)
- **Why**: Official Electron testing utilities
- **Use for**: Main process and IPC testing
- **Benefits**: Proper Electron environment simulation

## Testing Architecture

### Test Organization Structure

```
app/
├── main/
│   ├── __tests__/           # Main process tests
│   │   ├── main.test.ts
│   │   ├── settings.test.ts
│   │   ├── fs.test.ts
│   │   └── db/
│   │       ├── handlers/
│   │       │   ├── admin-handlers.test.ts
│   │       │   └── test-handlers.test.ts
│   │       └── services/
│   │           ├── base-service.test.ts
│   │           ├── provider-service.test.ts
│   │           ├── model-service.test.ts
│   │           └── agent-service.test.ts
│   └── api-server.test.ts
├── preload/
│   └── __tests__/
│       └── index.test.ts
└── renderer/
    └── src/
        ├── components/
        │   ├── __tests__/       # Component unit tests
        │   │   ├── Table.test.ts
        │   │   ├── Modal.test.ts
        │   │   └── admin/
        │   │       ├── AdminCrud.test.ts
        │   │       ├── AdminEntityManager.test.ts
        │   │       └── AdminFormModal.test.ts
        │   └── [component folders]/
        └── ts/
            └── features/
                ├── admin/
                │   ├── __tests__/
                │   │   ├── service.test.ts
                │   │   ├── store.test.ts
                │   │   └── relationship-utils.test.ts
                │   └── [feature files]
                └── [other features with same pattern]

packages/
└── db/
    └── src/
        └── __tests__/
            ├── client.test.ts
            └── schema.test.ts
```

### Test File Naming Conventions

- **Unit tests**: `[filename].test.ts` (colocated with source)
- **Integration tests**: `[feature].integration.test.ts`
- **E2E tests**: `[scenario].e2e.test.ts` (future phase)

## Priority Testing Areas

### Phase 1: Critical Business Logic (Week 1-2)

#### 1. Database Service Layer
```typescript
// Priority: CRITICAL
// Location: app/main/db/services/
```
- BaseService class (foundation for all services)
- ProviderService (CRUD operations)
- ModelService (with relationship handling)
- AgentService (complex relationships)

#### 2. AI Communication System
```typescript
// Priority: CRITICAL
// Location: app/renderer/src/ts/features/ai-communication/
```
- Provider adapters (OpenAI, Anthropic)
- Message formatting
- Streaming functionality
- Error handling

#### 3. Admin Feature Services
```typescript
// Priority: HIGH
// Location: app/renderer/src/ts/features/admin/
```
- Service layer (list, create, update, delete)
- Relationship utilities
- Store management

### Phase 2: Component Testing (Week 2-3)

#### 1. Admin Components
```typescript
// Priority: HIGH
// Location: app/renderer/src/components/admin/
```
- AdminEntityManager (orchestrator component)
- AdminFormModal (dynamic form generation)
- AdminRelationshipField (complex state management)
- Field components (validation, formatting)

#### 2. Core UI Components
```typescript
// Priority: HIGH
// Location: app/renderer/src/components/
```
- Table (filtering, sorting, editing)
- Modal (lifecycle, event handling)
- NavTree (recursive rendering)

### Phase 3: Integration Testing (Week 3-4)

#### 1. IPC Communication
```typescript
// Priority: HIGH
```
- Main ↔ Renderer communication
- Settings synchronization
- Database operations through IPC

#### 2. API Server
```typescript
// Priority: MEDIUM
```
- REST endpoints
- CORS handling
- Database service integration

### Phase 4: Store Testing (Week 4)

#### 1. Svelte Stores
```typescript
// Priority: MEDIUM
```
- All feature stores
- Store interactions
- Reactive subscriptions

## Implementation Steps

### Step 1: Setup Testing Infrastructure

```bash
# Install testing dependencies
npm install -D vitest @vitest/ui @testing-library/svelte \
  @testing-library/user-event @testing-library/jest-dom \
  c8 msw @electron/test happy-dom \
  @types/node
```

### Step 2: Configure Vitest

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test-setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test-setup.ts',
        '*.config.ts',
        '**/*.d.ts',
        '**/__tests__/**',
        '**/dist/**'
      ]
    },
    alias: {
      '~': path.resolve(__dirname, 'app'),
      '@renderer': path.resolve(__dirname, 'app/renderer/src'),
      '@views': path.resolve(__dirname, 'app/renderer/src/views'),
      '@ts': path.resolve(__dirname, 'app/renderer/src/ts'),
      '@features': path.resolve(__dirname, 'app/renderer/src/ts/features'),
      '@components': path.resolve(__dirname, 'app/renderer/src/components'),
    }
  }
});
```

### Step 3: Create Test Setup File

Create `test-setup.ts`:
```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Electron APIs
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(),
    whenReady: vi.fn(() => Promise.resolve()),
  },
  BrowserWindow: vi.fn(),
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
  },
}));

// Mock window.gc for renderer tests
if (typeof window !== 'undefined') {
  window.gc = {
    settings: {
      get: vi.fn(),
      getAll: vi.fn(),
      set: vi.fn(),
    },
    fs: {
      selectDirectory: vi.fn(),
      selectFile: vi.fn(),
      readDirectory: vi.fn(),
      readFile: vi.fn(),
      getFileInfo: vi.fn(),
    },
    db: {
      test: {
        list: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      providers: {
        list: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      models: {
        list: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      agents: {
        list: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
}
```

### Step 4: Update Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:main": "vitest run app/main",
    "test:renderer": "vitest run app/renderer",
    "test:db": "npm --workspace @gcomputer/db run test"
  }
}
```

### Step 5: Create Test Utilities

Create `app/renderer/src/ts/test-utils.ts`:
```typescript
import { render } from '@testing-library/svelte';
import type { ComponentType } from 'svelte';

export function renderComponent<T extends Record<string, any>>(
  Component: ComponentType,
  props?: T
) {
  return render(Component, { props });
}

export function createMockStore<T>(initialValue: T) {
  const subscribers = new Set<(value: T) => void>();
  let value = initialValue;

  return {
    subscribe(fn: (value: T) => void) {
      subscribers.add(fn);
      fn(value);
      return () => subscribers.delete(fn);
    },
    set(newValue: T) {
      value = newValue;
      subscribers.forEach(fn => fn(value));
    },
    update(fn: (value: T) => T) {
      value = fn(value);
      subscribers.forEach(sub => sub(value));
    }
  };
}
```

## Testing Best Practices

### 1. Test Structure (AAA Pattern)
```typescript
test('should handle provider creation', async () => {
  // Arrange
  const mockProvider = { name: 'OpenAI', code: 'openai' };
  
  // Act
  const result = await createProvider(mockProvider);
  
  // Assert
  expect(result).toMatchObject(mockProvider);
});
```

### 2. Component Testing
```typescript
test('AdminFormModal renders fields correctly', async () => {
  const { getByLabelText, getByRole } = renderComponent(AdminFormModal, {
    fields: [
      { id: 'name', label: 'Name', type: 'text', required: true }
    ]
  });
  
  expect(getByLabelText('Name')).toBeInTheDocument();
  expect(getByRole('button', { name: /submit/i })).toBeInTheDocument();
});
```

### 3. Service Testing with Mocks
```typescript
describe('ProviderService', () => {
  let service: ProviderService;
  
  beforeEach(() => {
    service = new ProviderService();
    vi.clearAllMocks();
  });
  
  test('list filters providers correctly', async () => {
    const mockProviders = [
      { id: 1, name: 'OpenAI', code: 'openai' },
      { id: 2, name: 'Anthropic', code: 'anthropic' }
    ];
    
    vi.mocked(service['getOrm']).mockResolvedValue({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockProviders)
        })
      })
    });
    
    const result = await service.list({ name: 'Open' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('OpenAI');
  });
});
```

### 4. Store Testing
```typescript
describe('adminStore', () => {
  test('setLoading updates loading state', () => {
    const unsubscribe = loadingState.subscribe(state => {
      expect(state.providers).toBe(false);
    });
    
    setLoading('providers', true);
    
    loadingState.subscribe(state => {
      expect(state.providers).toBe(true);
    });
    
    unsubscribe();
  });
});
```

## Coverage Goals

### Minimum Coverage Requirements
- **Overall**: 70%
- **Critical paths**: 90%
- **Business logic**: 85%
- **UI Components**: 60%
- **Utilities**: 95%

### Coverage Exclusions
- Generated files
- Type definitions
- Configuration files
- Test files themselves
- Third-party integrations (with mocks)

## CI/CD Integration (Future)

### GitHub Actions Workflow
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## Maintenance Strategy

### 1. Test-Driven Development (TDD)
- Write tests before implementing new features
- Update tests when modifying existing features
- Never merge code that breaks tests

### 2. Regular Test Reviews
- Weekly review of test coverage
- Monthly test refactoring sessions
- Quarterly test strategy evaluation

### 3. Test Documentation
- Document complex test scenarios
- Maintain test data fixtures
- Update this plan as architecture evolves

## Success Metrics

### Short-term (1 month)
- ✅ Testing infrastructure setup complete
- ✅ 70% coverage on critical business logic
- ✅ All database services tested
- ✅ Core components have basic tests

### Medium-term (3 months)
- 📊 80% overall code coverage
- 🔄 CI/CD pipeline with automated testing
- 📝 Complete test documentation
- 🎯 Zero regression bugs in production

### Long-term (6 months)
- 🚀 90% coverage on critical paths
- 🤖 Automated visual regression testing
- 📱 Cross-platform testing suite
- 🎨 Performance benchmarking tests

## Next Immediate Actions

1. **Install testing dependencies** (Step 1)
2. **Configure Vitest** (Step 2)
3. **Create test setup and utilities** (Steps 3 & 5)
4. **Update package.json scripts** (Step 4)
5. **Write first test for BaseService** (Phase 1, Priority 1)
6. **Establish test review process**

## Conclusion

This testing plan provides a pragmatic, phased approach to implementing comprehensive unit testing for GComputer. By leveraging the application's excellent architecture and focusing on critical business logic first, we can quickly establish a robust testing foundation that ensures code quality and prevents regressions.

The selected tools (Vitest, Testing Library, MSW) integrate seamlessly with the existing tech stack and provide excellent developer experience. The phased implementation allows for immediate value delivery while building toward comprehensive coverage.