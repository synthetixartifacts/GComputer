# Unit Testing Implementation Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install -D vitest @vitest/ui @testing-library/svelte \
  @testing-library/user-event @testing-library/jest-dom \
  happy-dom msw @types/node
```

### 2. Run Tests
```bash
npm run test          # Run tests in watch mode
npm run test:ui       # Open Vitest UI
npm run test:run      # Run tests once
npm run test:coverage # Run with coverage report
```

## Created Files

### Core Configuration
- ✅ `TESTING_PLAN.md` - Comprehensive testing strategy
- ✅ `vitest.config.ts` - Vitest configuration with coverage settings
- ✅ `test-setup.ts` - Global test setup with mocks
- ✅ `app/renderer/src/ts/test-utils.ts` - Testing utilities and helpers

### Example Tests
- ✅ `app/main/db/services/__tests__/base-service.test.ts` - Database service testing pattern
- ✅ `app/renderer/src/components/admin/__tests__/AdminEntityManager.test.ts` - Svelte component testing pattern
- ✅ `app/renderer/src/ts/features/admin/__tests__/service.test.ts` - Feature service testing pattern

## Update package.json

Add these scripts to your package.json:

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

Also add test script to packages/db/package.json:
```json
{
  "scripts": {
    "test": "vitest"
  }
}
```

## Testing Patterns by File Type

### 1. Database Services (BaseService pattern)
```typescript
// Location: app/main/db/services/__tests__/[service].test.ts
// Example: base-service.test.ts
// Key patterns:
- Mock ORM operations
- Test CRUD operations
- Test filtering and where clauses
- Test error handling
```

### 2. Svelte Components
```typescript
// Location: app/renderer/src/components/__tests__/[Component].test.ts
// Example: AdminEntityManager.test.ts
// Key patterns:
- Use @testing-library/svelte
- Test rendering and props
- Test user interactions
- Test store reactivity
- Mock child components when needed
```

### 3. Feature Services
```typescript
// Location: app/renderer/src/ts/features/[feature]/__tests__/service.test.ts
// Example: admin/service.test.ts
// Key patterns:
- Mock environment detection
- Test both Electron and browser paths
- Mock IPC calls
- Test error propagation
```

### 4. Stores
```typescript
// Location: app/renderer/src/ts/features/[feature]/__tests__/store.test.ts
// Pattern:
import { subscribeToStore, waitForStoreValue } from '@ts/test-utils';

test('store updates correctly', async () => {
  const { values, unsubscribe } = subscribeToStore(myStore);
  myStore.set(newValue);
  expect(values[1]).toEqual(newValue);
  unsubscribe();
});
```

### 5. Main Process
```typescript
// Location: app/main/__tests__/[file].test.ts
// Pattern:
import { createMockIpcHandler } from '../../../test-setup';

test('IPC handler works', async () => {
  const ipc = createMockIpcHandler();
  registerMyHandler(ipc);
  const result = await ipc.invoke('my-channel', data);
  expect(result).toEqual(expected);
});
```

## Priority Testing Order

### Week 1: Critical Business Logic
1. ✅ BaseService (example created)
2. ProviderService, ModelService, AgentService
3. AI Communication adapters
4. Database client initialization

### Week 2: Core Components
1. ✅ AdminEntityManager (example created)
2. AdminFormModal & field components
3. Table component (filtering, sorting)
4. Modal & navigation components

### Week 3: Feature Services
1. ✅ Admin service (example created)
2. Settings service & store
3. Router service & store
4. File access service

### Week 4: Integration
1. IPC handlers (main process)
2. API server endpoints
3. Store interactions
4. End-to-end flows

## Best Practices

### 1. Test Organization
```
feature/
├── service.ts
├── store.ts
├── types.ts
└── __tests__/
    ├── service.test.ts
    ├── store.test.ts
    └── integration.test.ts
```

### 2. Test Structure (AAA)
```typescript
test('descriptive test name', async () => {
  // Arrange - setup test data
  const mockData = createMockEntity('provider');
  
  // Act - perform action
  const result = await service.create(mockData);
  
  // Assert - verify outcome
  expect(result).toMatchObject(mockData);
});
```

### 3. Mock Management
```typescript
beforeEach(() => {
  vi.clearAllMocks(); // Clear call history
});

afterEach(() => {
  vi.resetAllMocks(); // Reset mock implementations
});
```

### 4. Async Testing
```typescript
// Use waitFor for async DOM updates
await waitFor(() => {
  expect(element).toBeInTheDocument();
});

// Use resolvePromises for async operations
await resolvePromises();
```

### 5. Component Testing
```typescript
// Always clean up subscriptions
const unsubscribe = store.subscribe(callback);
// ... test code
unsubscribe();
```

## Coverage Goals

### Minimum Requirements
- Overall: 70%
- Critical paths: 90%
- Business logic: 85%
- UI Components: 60%
- Utilities: 95%

### Check Coverage
```bash
npm run test:coverage
# Open coverage/index.html in browser
```

## Common Issues & Solutions

### Issue: "Cannot find module" errors
**Solution**: Check path aliases in vitest.config.ts match tsconfig.json

### Issue: Svelte component not rendering
**Solution**: Ensure happy-dom environment is set in vitest.config.ts

### Issue: Electron APIs undefined
**Solution**: Check test-setup.ts mocks are complete

### Issue: Async tests timing out
**Solution**: Increase timeout in test or use waitFor with longer timeout

### Issue: Store subscriptions leaking
**Solution**: Always unsubscribe in test cleanup

## CI/CD Integration (Future)

Create `.github/workflows/test.yml`:
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
        with:
          file: ./coverage/lcov.info
```

## Next Steps

1. **Install dependencies** (see Quick Start)
2. **Update package.json** with test scripts
3. **Run first test** to verify setup:
   ```bash
   npm run test app/main/db/services/__tests__/base-service.test.ts
   ```
4. **Start implementing tests** following the priority order
5. **Set up pre-commit hook** (optional):
   ```bash
   npx husky add .husky/pre-commit "npm run test:run"
   ```

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library](https://testing-library.com/docs/svelte-testing-library/intro)
- [MSW Documentation](https://mswjs.io)
- Example tests in this codebase (see Created Files section)

## Support

If you encounter issues:
1. Check this guide's Common Issues section
2. Review example tests for patterns
3. Ensure all dependencies are installed
4. Verify configuration files match examples

The testing infrastructure is now ready for implementation. Start with high-priority items and gradually expand coverage.