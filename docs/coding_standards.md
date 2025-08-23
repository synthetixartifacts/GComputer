# GComputer Coding Standards
## Application Architecture
### Process Model Overview
GComputer follows Electron's multi-process architecture with strict separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     MAIN PROCESS (Node.js)                  │
│  app/main/ - Full system access, controls everything        │
├─────────────────────────────────────────────────────────────┤
│                    PRELOAD (Bridge)                         │
│  app/preload/ - Security layer, exposes safe APIs           │
├─────────────────────────────────────────────────────────────┤
│                   RENDERER (Browser)                        │
│  app/renderer/ - UI only, no system access                  │
└─────────────────────────────────────────────────────────────┘
```

### app/main/ - Electron Main Process
**Purpose**: System orchestrator with full Node.js and OS access  
**Responsibilities**:
- Window lifecycle management (create, show, close)
- Native system operations (file system, OS integration)
- Database operations and migrations
- IPC handler registration and validation
- REST API server for browser fallback
- Application menu and system tray
- Security enforcement and permission checking

**What belongs here**:
- IPC handlers that need system access
- Database services and migrations
- File system operations
- Native API integrations
- Window management logic
- Application initialization

**What DOESN'T belong here**:
- UI components or rendering logic
- Business logic that could run in renderer
- Direct DOM manipulation
- Style or presentation code

### app/preload/ - Security Bridge
**Purpose**: Controlled exposure of main process capabilities to renderer  
**Responsibilities**:
- Define the `window.gc` API surface
- Validate and sanitize IPC communication
- Provide type-safe interfaces for renderer
- Block dangerous operations
- Enforce security boundaries

**What belongs here**:
- `contextBridge.exposeInMainWorld()` calls
- IPC renderer wrappers with validation
- Type definitions for exposed APIs
- Security checks and sanitization

**What DOESN'T belong here**:
- Business logic implementation
- Direct Node.js module usage
- Complex data transformations
- UI-related code

### app/renderer/ - UI Layer
**Purpose**: User interface and interaction handling  
**Responsibilities**:
- Render UI components with Svelte
- Handle user interactions
- Manage application state
- Call `window.gc` APIs for system operations
- Provide fallback to REST API when needed

**Structure**:
app/renderer/
├── src/
│   ├── views/          # Page-level components (thin logic)
│   ├── components/     # Reusable UI components
│   ├── ts/features/    # Business logic and state management
│   └── styles/         # SCSS design system (NO component styles)

**What belongs here**:
- Svelte components and views
- Client-side state management
- UI event handlers
- Business logic that doesn't need system access
- API client code (REST/IPC wrappers)

**What DOESN'T belong here**:
- Direct Node.js imports (fs, path, etc.)
- Direct Electron imports
- Database operations (use IPC)
- File system access (use window.gc)
- Inline styles or `<style>` blocks

### Communication Flow
```typescript
// CORRECT: Renderer → Preload → Main → Preload → Renderer
// Renderer (app/renderer/src/ts/features/settings/service.ts)
const settings = await window.gc.settings.get('theme');

// Preload (app/preload/index.ts)
settings: {
  get: (key) => ipcRenderer.invoke('settings:get', key)
}

// Main (app/main/settings.ts)
ipcMain.handle('settings:get', async (event, key) => {
  // Validate input
  if (!isValidKey(key)) throw new Error('Invalid key');
  // Perform operation with full Node.js access
  return await readSettingsFile()[key];
});
```

### Security Boundaries
- **Main Process**: Trusted, full access to system
- **Preload**: Security checkpoint, validates all communication
- **Renderer**: Untrusted, sandboxed, no direct system access

**Critical Rules**:
1. NEVER expose Node.js modules to renderer
2. ALWAYS validate IPC inputs in main process
3. Use `contextIsolation: true` and `nodeIntegration: false`
4. Sanitize all user inputs before database operations
5. Never return sensitive data (passwords, keys) to renderer

## Core Principles
### DRY (Don't Repeat Yourself)
- **ALWAYS** search for existing components before creating new ones
- Use the 30+ existing components (Table, Modal, SearchBox, etc.)
- Extract common logic into utilities or services
- Create reusable hooks for repeated Svelte patterns

### KISS (Keep It Simple, Stupid)
- Prefer simple, readable code over clever abstractions
- Functions should do one thing well
- Avoid premature optimization
- Use descriptive names over comments

### Security First
- **NEVER** expose Node.js/Electron APIs to renderer
- All system access through `window.gc` preload bridge
- Validate all IPC inputs in main process
- Sanitize user inputs before database operations
- Never log sensitive information (API keys, passwords)

### Type Safety
- **NO `any` types** - use `unknown` and type guards if needed
- Explicit return types for all exported functions
- Use interfaces over type aliases when possible
- Leverage TypeScript's strict mode fully

## Project Structure
### Feature Module Pattern (MANDATORY)
Every feature MUST follow this exact structure:

```
app/renderer/src/ts/features/<feature-name>/
├── types.ts              # All TypeScript interfaces/types
├── service.ts            # Business logic, API calls
├── store.ts              # Svelte stores for state
├── index.ts              # Public API exports
├── electron-service.ts   # Electron-specific implementation (optional)
├── browser-service.ts    # Browser fallback (optional)
├── utils.ts              # Helper functions (optional)
└── __tests__/            # Unit tests
    ├── service.test.ts
    └── store.test.ts
```

### File Organization Rules
```
app/
├── main/                 # Electron main process
│   ├── db/              # Database handlers & services
│   ├── ipc/             # IPC handler registration
│   └── api-server/      # Express REST API
├── preload/             # Security bridge
│   └── index.ts         # window.gc API exposure
└── renderer/            # UI layer
    ├── views/           # Page components (thin)
    ├── components/      # Reusable UI components
    └── ts/features/     # Business logic & state
```

### Import Order
1. Node/Electron imports
2. External libraries
3. Path alias imports (`@features`, `@components`)
4. Relative imports
5. Type imports

```typescript
// Good
import { app } from 'electron';
import { writable } from 'svelte/store';
import { SomeService } from '@features/some/service';
import { helper } from './utils';
import type { SomeType } from './types';
```

## TypeScript Standards

### Naming Conventions
```typescript
// Variables and functions: camelCase
const userName = 'John';
function calculateTotal() {}

// Types, interfaces, classes: PascalCase
interface UserProfile {}
type ResponseStatus = 'success' | 'error';
class DatabaseService {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';

// Enums: PascalCase with UPPER_SNAKE_CASE values
enum Status {
  PENDING = 'pending',
  COMPLETED = 'completed'
}

// Private class members: underscore prefix
class Service {
  private _cache = new Map();
}
```

### Type Definitions
```typescript
// GOOD: Explicit and narrow types
interface UserData {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

function getUser(id: number): Promise<UserData | null> {
  // implementation
}

// BAD: Loose types
function getUser(id: any): Promise<any> {
  // Never do this
}
```

### Null Handling
```typescript
// Use optional chaining
const name = user?.profile?.name ?? 'Unknown';

// Use nullish coalescing
const port = process.env.PORT ?? 3000;

// Explicit null checks
if (data !== null && data !== undefined) {
  // process data
}

// Type guards
function isValidUser(user: unknown): user is UserData {
  return (
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    'name' in user
  );
}
```

### Async/Await Patterns
```typescript
// GOOD: Clean async/await with error handling
async function fetchData(): Promise<Result> {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw new Error('Data fetch failed');
  }
}

// BAD: Mixing promises and async/await
async function fetchData() {
  return fetch('/api/data').then(res => res.json()); // Don't mix patterns
}
```

## Svelte 5 Patterns

### Component Structure
```svelte
<script lang="ts">
  // 1. Imports
  import { onMount, onDestroy } from 'svelte';
  import { someStore } from '@features/feature/store';
  import type { ComponentProps } from './types';
  
  // 2. Props with types
  interface Props {
    title: string;
    count?: number;
  }
  let { title, count = 0 }: Props = $props();
  
  // 3. State declarations
  let localState = $state(initialValue);
  let computedValue = $derived(localState * 2);
  
  // 4. Store subscriptions
  let storeValue = $state<string>();
  let unsubscribe: (() => void) | undefined;
  
  // 5. Lifecycle hooks
  onMount(() => {
    unsubscribe = someStore.subscribe(value => {
      storeValue = value;
    });
    
    // Return cleanup function
    return () => {
      unsubscribe?.();
    };
  });
  
  // 6. Event handlers
  function handleClick() {
    // handler logic
  }
  
  // 7. Reactive statements
  $effect(() => {
    console.log('Count changed:', count);
  });
</script>

<!-- Template with proper conditional rendering -->
{#if loading}
  <div>Loading...</div>
{:else if error}
  <div>Error: {error.message}</div>
{:else}
  <div>{content}</div>
{/if}
```

### Store Management
```typescript
// store.ts
import { writable, derived, get } from 'svelte/store';

// Simple writable store
export const userStore = writable<User | null>(null);

// Derived store
export const isLoggedIn = derived(
  userStore,
  $user => $user !== null
);

// Custom store with methods
function createCounterStore() {
  const { subscribe, set, update } = writable(0);
  
  return {
    subscribe,
    increment: () => update(n => n + 1),
    decrement: () => update(n => n - 1),
    reset: () => set(0)
  };
}

export const counter = createCounterStore();
```

### Props and Events
```svelte
<!-- Parent Component -->
<script lang="ts">
  import ChildComponent from './ChildComponent.svelte';
  
  function handleCustomEvent(event: CustomEvent<{value: string}>) {
    console.log('Received:', event.detail.value);
  }
</script>

<ChildComponent 
  title="Hello"
  onCustomEvent={handleCustomEvent}
/>

<!-- Child Component -->
<script lang="ts">
  interface Props {
    title: string;
    onCustomEvent?: (event: CustomEvent<{value: string}>) => void;
  }
  
  let { title, onCustomEvent }: Props = $props();
  
  function emitEvent() {
    onCustomEvent?.(new CustomEvent('customEvent', {
      detail: { value: 'test' }
    }));
  }
</script>
```

## Styling Guidelines

### SCSS Organization
```scss
// app/renderer/src/styles/global.scss
@import 'base/variables';      // Design tokens
@import 'base/mixins';         // Reusable mixins
@import 'base/layout';         // Layout utilities
@import 'base/elements';       // Element resets
@import 'base/motion';         // Animations

@import 'components/table';    // Component styles
@import 'components/modal';
@import 'components/nav-tree';
```

### CSS Naming Convention (BEM-inspired)
```scss
// Block
.discussion-list { }

// Element
.discussion-list__item { }
.discussion-list__header { }

// Modifier
.discussion-list--compact { }
.discussion-list__item--active { }

// State
.discussion-list.is-loading { }
.discussion-list__item.is-selected { }
```

### Theme Variables
```scss
// Use CSS custom properties for theming
:root {
  --color-primary: #007bff;
  --color-background: #ffffff;
  --spacing-unit: 8px;
}

[data-theme="dark"] {
  --color-primary: #4dabf7;
  --color-background: #1a1a1a;
}

// Use the variables
.component {
  background: var(--color-background);
  padding: calc(var(--spacing-unit) * 2);
}
```

### Forbidden Practices
```svelte
<!-- NEVER: Inline styles -->
<div style="color: red;">Bad</div>

<!-- NEVER: Style blocks in components -->
<style>
  .bad { color: red; }
</style>

<!-- GOOD: Use classes -->
<div class="text-error">Good</div>
```

## Security Requirements

### IPC Communication
```typescript
// main/ipc/handler.ts
ipcMain.handle('operation', async (event, untrustedInput) => {
  // ALWAYS validate input
  if (!isValidInput(untrustedInput)) {
    throw new Error('Invalid input');
  }
  
  // Sanitize if needed
  const sanitized = sanitizeInput(untrustedInput);
  
  // Perform operation
  return await performOperation(sanitized);
});

// preload/index.ts
contextBridge.exposeInMainWorld('gc', {
  feature: {
    operation: (input: string) => ipcRenderer.invoke('operation', input)
  }
});

// renderer - ONLY use window.gc
const result = await window.gc.feature.operation('data');
```

### Database Security
```typescript
// NEVER: Direct SQL concatenation
const query = `SELECT * FROM users WHERE id = ${userId}`; // SQL Injection risk!

// GOOD: Use Drizzle ORM with parameterized queries
import { eq } from 'drizzle-orm';
const user = await db.select().from(users).where(eq(users.id, userId));
```

### API Key Management
```typescript
// NEVER: Hardcode secrets
const API_KEY = 'sk-1234567890'; // Never do this!

// GOOD: Use environment variables or secure storage
const apiKey = await window.gc.config.getProviderSecret('openai');
if (!apiKey) {
  throw new Error('API key not configured');
}
```

## Database Patterns

### Service Layer Pattern
```typescript
// services/entity-service.ts
export class EntityService {
  async list(filters?: EntityFilters): Promise<Entity[]> {
    const query = db.select().from(entities);
    
    if (filters?.name) {
      query.where(like(entities.name, `%${filters.name}%`));
    }
    
    return await query;
  }
  
  async create(data: EntityInsert): Promise<Entity> {
    const [entity] = await db.insert(entities)
      .values(data)
      .returning();
    return entity;
  }
  
  async update(id: number, data: EntityUpdate): Promise<Entity> {
    const [entity] = await db.update(entities)
      .set(data)
      .where(eq(entities.id, id))
      .returning();
    return entity;
  }
  
  async delete(id: number): Promise<void> {
    await db.delete(entities).where(eq(entities.id, id));
  }
}
```

### Migration Pattern
```typescript
// packages/db/src/db/schema.ts
export const newTable = sqliteTable('new_table', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Generate migration
// npm --workspace @gcomputer/db run drizzle:generate
```

## Testing Standards

### Test File Structure
```typescript
// __tests__/service.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServiceClass } from '../service';

describe('ServiceClass', () => {
  let service: ServiceClass;
  
  beforeEach(() => {
    service = new ServiceClass();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('methodName', () => {
    it('should handle normal case', async () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = await service.method(input);
      
      // Assert
      expect(result).toBe('expected');
    });
    
    it('should handle error case', async () => {
      // Test error handling
      await expect(service.method(null)).rejects.toThrow('Invalid input');
    });
  });
});
```

### Mocking Patterns
```typescript
// Mock window.gc for renderer tests
vi.mock('@renderer/src/ts/app.d.ts', () => ({
  window: {
    gc: {
      settings: {
        get: vi.fn().mockResolvedValue('mocked'),
        set: vi.fn().mockResolvedValue(true),
      }
    }
  }
}));

// Mock modules
vi.mock('@features/ai-communication/service', () => ({
  AICommunicationService: vi.fn().mockImplementation(() => ({
    sendMessage: vi.fn().mockResolvedValue({ response: 'mocked' })
  }))
}));
```

### Coverage Requirements
- **Minimum**: 70% for all new code
- **Critical Features**: 90% (DB, AI, IPC, Settings)
- **UI Components**: 60% minimum
- **Utilities**: 95% (pure functions should be fully tested)

## Error Handling

### Error Types
```typescript
// Custom error classes
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}
```

### Error Handling Patterns
```typescript
// Service layer
async function fetchData(): Promise<Result> {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new NetworkError(
        `Request failed: ${response.statusText}`,
        response.status
      );
    }
    return await response.json();
  } catch (error) {
    // Log for debugging
    console.error('Fetch error:', error);
    
    // Re-throw with context
    if (error instanceof NetworkError) {
      throw error;
    }
    throw new Error('Failed to fetch data');
  }
}

// Component layer
try {
  const data = await fetchData();
  // process data
} catch (error) {
  // User-friendly message
  if (error instanceof NetworkError && error.statusCode === 404) {
    showNotification('Data not found');
  } else {
    showNotification('Something went wrong. Please try again.');
  }
}
```

### Fallback Strategies
```typescript
// Graceful degradation
async function getSettings(): Promise<Settings> {
  try {
    // Try Electron IPC
    if (window.gc?.settings) {
      return await window.gc.settings.all();
    }
  } catch (error) {
    console.warn('IPC failed, falling back to localStorage:', error);
  }
  
  // Fallback to localStorage
  const stored = localStorage.getItem('settings');
  return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
}
```

## Performance Guidelines

### Component Optimization
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  
  // Debounce user input
  let searchTerm = $state('');
  let debouncedSearch = $state('');
  let debounceTimer: NodeJS.Timeout;
  
  $effect(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debouncedSearch = searchTerm;
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  });
  
  // Lazy load heavy components
  let HeavyComponent: any;
  onMount(async () => {
    const module = await import('./HeavyComponent.svelte');
    HeavyComponent = module.default;
  });
</script>

{#if HeavyComponent}
  <HeavyComponent />
{/if}
```

### Store Optimization
```typescript
// Prevent memory leaks
export function createOptimizedStore() {
  const subscribers = new Set<(value: any) => void>();
  let value = initialValue;
  
  return {
    subscribe(fn: (value: any) => void) {
      subscribers.add(fn);
      fn(value);
      
      // Return unsubscribe function
      return () => {
        subscribers.delete(fn);
      };
    },
    
    // Clean up method
    destroy() {
      subscribers.clear();
    }
  };
}
```

### List Rendering
```svelte
<!-- Use keyed each blocks for better performance -->
{#each items as item (item.id)}
  <ItemComponent {item} />
{/each}

<!-- Virtual scrolling for large lists -->
<script>
  import { VirtualList } from '@components/VirtualList.svelte';
</script>

<VirtualList {items} itemHeight={50} />
```

## Git Workflow

### Branch Naming
```bash
feature/add-user-authentication
fix/resolve-database-connection
refactor/improve-service-layer
docs/update-api-documentation
test/add-integration-tests
```

### Commit Messages
```bash
# Format: <type>: <description>

feat: add user authentication system
fix: resolve database connection timeout
refactor: improve service layer architecture
docs: update API documentation
test: add integration tests for auth
chore: update dependencies
perf: optimize list rendering
style: format code according to standards
```

### Pre-commit Checklist
```bash
# Run before every commit
npm run typecheck        # No TypeScript errors
npm run test:run         # All tests pass
npm run lint            # No linting issues (if available)

# For significant changes
npm run test:coverage   # Check coverage hasn't dropped
```

## Code Review Checklist

### Security
- [ ] No hardcoded secrets or API keys
- [ ] All IPC handlers validate input
- [ ] No direct Node/Electron imports in renderer
- [ ] Database queries use parameterized statements
- [ ] Error messages don't expose sensitive info

### Type Safety
- [ ] No `any` types used
- [ ] All functions have explicit return types
- [ ] Proper null/undefined handling
- [ ] Type guards for runtime validation

### Architecture
- [ ] Follows feature module pattern
- [ ] Business logic in services, not components
- [ ] Proper separation of concerns
- [ ] DRY principle followed

### Performance
- [ ] Large lists use virtual scrolling
- [ ] User inputs are debounced
- [ ] Store subscriptions are cleaned up
- [ ] Heavy components are lazy loaded

### Testing
- [ ] Critical paths have tests
- [ ] Edge cases are covered
- [ ] Mocks are properly cleaned up
- [ ] Coverage meets requirements

### Documentation
- [ ] Complex logic has comments
- [ ] Public APIs are documented
- [ ] README updated if needed
- [ ] CHANGELOG updated

### Style
- [ ] Consistent naming conventions
- [ ] Proper import ordering
- [ ] No inline styles or style blocks
- [ ] SCSS follows BEM conventions

## Quick Reference

### Common Patterns
```typescript
// Singleton service
class Service {
  private static instance: Service;
  static getInstance(): Service {
    if (!Service.instance) {
      Service.instance = new Service();
    }
    return Service.instance;
  }
}

// Factory pattern
function createService(type: 'electron' | 'browser') {
  return type === 'electron' 
    ? new ElectronService() 
    : new BrowserService();
}

// Repository pattern
class Repository<T> {
  async findAll(): Promise<T[]> { }
  async findById(id: number): Promise<T | null> { }
  async create(data: Partial<T>): Promise<T> { }
  async update(id: number, data: Partial<T>): Promise<T> { }
  async delete(id: number): Promise<void> { }
}
```

### Useful Type Utilities
```typescript
// Make all properties optional except specified
type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Omit multiple properties
type OmitMultiple<T, K extends keyof T> = Omit<T, K>;

// Deep partial
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Value of object
type ValueOf<T> = T[keyof T];
```

## Enforcement

These standards are enforced through:
1. **TypeScript strict mode** - Catches type violations
2. **Code reviews** - Manual verification of patterns
3. **Tests** - Ensure code quality and coverage
4. **Pre-commit hooks** - Automated checks (when configured)

All team members must follow these standards. Exceptions require explicit justification in code comments and PR descriptions.