# Context Menu Refactor Plan

## Current Issues
1. **Inline HTML in main process** - Security risk with `contextIsolation: false`
2. **No feature module structure** - Code scattered across main/renderer
3. **Mixed concerns** - Window management, shortcuts, and actions coupled
4. **Poor type safety** - Using `any` types and missing interfaces
5. **No service layer** - Business logic mixed with UI
6. **No tests** - Critical feature without coverage
7. **Not extensible** - Hard-coded actions in inline HTML

## Refactor Goals
- Follow GComputer coding standards strictly
- Create scalable, maintainable architecture
- Enable easy addition of new actions
- Improve security (enable contextIsolation)
- Add comprehensive type safety
- Implement proper IPC patterns
- Add test coverage

## Architecture Overview

### Main Process (`app/main/context-menu/`)
```
context-menu/
├── types.ts              # Main process types
├── window-manager.ts     # BrowserWindow management
├── shortcut-manager.ts   # Global shortcuts
├── action-registry.ts    # Action registration & execution
├── ipc-handlers.ts       # IPC handler setup
├── config.ts            # Configuration management
└── index.ts             # Public API
```

### Renderer Process (`app/renderer/src/ts/features/context-menu/`)
```
context-menu/
├── types.ts             # Shared types & interfaces
├── service.ts           # Business logic & IPC wrapper
├── store.ts            # Svelte stores
├── action-factory.ts    # Action creation utilities
├── utils.ts            # Helper functions
├── index.ts            # Public exports
└── __tests__/          # Unit tests
```

### Components (`app/renderer/src/components/context-menu/`)
```
context-menu/
├── ContextMenu.svelte       # Main menu component
├── MenuItem.svelte          # Individual menu item
├── MenuGroup.svelte         # Group of related items
├── MenuDivider.svelte       # Visual separator
└── QuickActions.svelte      # Quick action bar
```

## Implementation Steps

### Phase 1: Type System & Core Structure
1. **Enhanced Type Definitions**
   - Complete type coverage for all interfaces
   - No `any` types allowed
   - Proper error types
   - Event types for all interactions

2. **Service Layer Pattern**
   ```typescript
   class ContextMenuService {
     // Singleton pattern
     // Handles all business logic
     // Wraps IPC calls with fallbacks
     // Action registration & execution
   }
   ```

3. **Store Management**
   ```typescript
   // Reactive stores for state
   const contextMenuState = writable<ContextMenuState>()
   const enabledActions = derived(...)
   const groupedActions = derived(...)
   ```

### Phase 2: Secure Window Management
1. **Enable Context Isolation**
   ```typescript
   webPreferences: {
     preload: path.join(__dirname, '../preload/context-menu.js'),
     contextIsolation: true,  // MUST be true
     nodeIntegration: false,
     sandbox: true
   }
   ```

2. **Dedicated Preload Script**
   ```typescript
   // app/preload/context-menu.ts
   contextBridge.exposeInMainWorld('gcContextMenu', {
     show: (options) => ipcRenderer.invoke('context-menu:show', options),
     hide: () => ipcRenderer.invoke('context-menu:hide'),
     executeAction: (action) => ipcRenderer.invoke('context-menu:execute', action)
   })
   ```

3. **Proper Window Lifecycle**
   - Lazy window creation
   - Proper cleanup on destroy
   - Focus management without stealing
   - Position calculation with screen bounds

### Phase 3: Extensible Action System
1. **Action Registry Pattern**
   ```typescript
   class ActionRegistry {
     private actions = new Map<string, ContextMenuAction>()
     
     register(action: ContextMenuAction): void
     unregister(actionId: string): void
     execute(actionId: string, context: ActionContext): Promise<ActionResult>
   }
   ```

2. **Built-in Actions**
   - Text manipulation (copy, paste, cut)
   - AI actions (translate, grammar, summarize)
   - System actions (screenshot, search)
   - Custom user actions

3. **Action Handlers**
   ```typescript
   interface ActionHandler {
     id: string
     validate(context: ActionContext): boolean
     execute(context: ActionContext): Promise<ActionResult>
   }
   ```

### Phase 4: Component Architecture
1. **Main Menu Component**
   ```svelte
   <script lang="ts">
     let { actions, position, onSelect } = $props()
     // Keyboard navigation
     // Mouse interaction
     // Accessibility (ARIA)
   </script>
   ```

2. **Menu Item Component**
   ```svelte
   <script lang="ts">
     let { action, isSelected, onExecute } = $props()
     // Icon rendering
     // Shortcut display
     // Disabled state
   </script>
   ```

3. **Styling (SCSS only)**
   ```scss
   // app/renderer/src/styles/components/_context-menu.scss
   .context-menu {
     &__container { }
     &__item { }
     &__item--selected { }
     &__item--disabled { }
   }
   ```

### Phase 5: IPC Communication
1. **Main Process Handlers**
   ```typescript
   ipcMain.handle('context-menu:show', validateAndShow)
   ipcMain.handle('context-menu:hide', validateAndHide)
   ipcMain.handle('context-menu:execute', validateAndExecute)
   ```

2. **Input Validation**
   ```typescript
   function validateShowRequest(request: unknown): ShowMenuRequest {
     // Strict validation
     // Type guards
     // Sanitization
   }
   ```

3. **Error Handling**
   ```typescript
   class ContextMenuError extends Error {
     constructor(message: string, public code: string) {
       super(message)
     }
   }
   ```

### Phase 6: Configuration System
1. **User Preferences**
   ```typescript
   interface UserPreferences {
     shortcuts: ShortcutConfig
     enabledActions: string[]
     theme: MenuTheme
     position: PositionPreference
   }
   ```

2. **Dynamic Loading**
   - Load from settings
   - Hot reload on change
   - Persist user changes

### Phase 7: Testing
1. **Unit Tests**
   - Service layer (90% coverage)
   - Store logic (90% coverage)
   - Action handlers (95% coverage)
   - Utilities (100% coverage)

2. **Integration Tests**
   - IPC communication
   - Window lifecycle
   - Shortcut registration

3. **Component Tests**
   - Render testing
   - Event handling
   - Accessibility

## Migration Plan
1. Create new structure alongside existing code
2. Implement core services with tests
3. Build new components
4. Create migration script for settings
5. Switch over in single commit
6. Remove old code after verification

## Success Criteria
- ✅ No `any` types in codebase
- ✅ 80% test coverage minimum
- ✅ Context isolation enabled
- ✅ All styles in SCSS files
- ✅ Proper feature module structure
- ✅ Extensible action system
- ✅ Clean separation of concerns
- ✅ Full TypeScript strict mode

## Timeline Estimate
- Phase 1-2: Core structure (2 hours)
- Phase 3-4: Components & actions (3 hours)
- Phase 5-6: IPC & config (2 hours)
- Phase 7: Testing (2 hours)
- Migration: (1 hour)

Total: ~10 hours of focused development