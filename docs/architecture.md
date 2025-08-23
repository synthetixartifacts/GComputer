# Architecture

> **Important**: Before implementing features, read [`coding_standards.md`](./coding_standards.md) for detailed patterns and requirements.

## Stack
- **Electron** (main, preload, renderer processes)
- **Svelte 5** + Tailwind CSS + SCSS (renderer UI)
- **TypeScript** strict mode everywhere
- **SQLite** + Drizzle ORM (local database)
- **Vite** (renderer build), **esbuild** (main/preload)

## High-level Structure

```
app/
  main/                    # Electron main process → dist/main/index.cjs
    main.ts               # Entry point, orchestrates initialization
    window.ts             # Window management and lifecycle
    initialization.ts     # Application setup and feature init
    environment.ts        # Environment configuration loading
    api-server.ts         # Express REST API server (port 3001)
    db.ts                 # Database integration and migrations
    ipc/                  # IPC handler registration
      index.ts            # Central IPC registration
    db/
      handlers/           # IPC handlers for database operations
        admin-handlers.ts # AI entity management handlers
        discussion-handlers.ts # Discussion/message handlers
        test-handlers.ts  # Test table handlers
        index.ts          # Handler exports
      services/           # Shared service layer
        base-service.ts   # Base CRUD service
        provider-service.ts # AI provider operations
        model-service.ts  # AI model operations
        agent-service.ts  # AI agent operations
        discussion-service.ts # Discussion/message operations
        test-service.ts   # Test table operations
      seeding.ts          # Default data seeding
      types.ts            # Database type definitions
    fs.ts                 # File system operations (IPC handlers)
    menu.ts               # Native application menu
    settings.ts           # Settings persistence and IPC
    i18n/menu.ts          # Menu localization (main process)
  
  preload/                 # Secure IPC bridge → dist/preload/index.cjs
    index.ts              # Comprehensive API exposure via contextBridge
    future-apis.ts        # Planned API surface for future features
  
  renderer/                # Svelte 5 UI → dist/renderer/
    index.html            # Entry HTML
    src/
      views/              # 24+ page-level Svelte components (organized by feature)
        App.svelte        # Root component with routing
        HomeView.svelte   # Landing page
        admin/entity/llm/ # AI management views
          AdminAgentView.svelte
          AdminModelView.svelte
          AdminProviderView.svelte
        development/      # Development & testing views
          ai/TestAICommunicationView.svelte
          db/TestDbTableView.svelte
          features/       # Feature testing views
          styleguide/     # Component showcase (dev-only)
        browse/BrowseView.svelte
        settings/        # Settings views
        ...
      
      components/         # 30+ reusable UI components
        # Core Layout (6)
        Header.svelte     # App header with theme toggle
        Footer.svelte     # App footer
        Sidebar.svelte    # Collapsible sidebar
        Drawer.svelte     # Slide-out panel
        Modal.svelte      # Accessible modal with focus trap
        ProgressBar.svelte # Progress indicator
        
        # Data Display (6)
        Table.svelte      # Advanced data table (filtering, sorting, editing)
        FileList.svelte   # File display wrapper over Table
        FileGrid.svelte   # Grid view for files
        GalleryGrid.svelte # Media gallery grid
        ImageCard.svelte  # Individual image card
        ViewToggle.svelte # List/grid view switcher
        
        # Navigation (1)
        NavTree.svelte    # Recursive navigation tree
        
        # Admin System (10 components)
        admin/AdminCrud.svelte              # CRUD interface
        admin/AdminEntityManager.svelte     # Entity management
        admin/AdminFormModal.svelte         # Dynamic form modal
        admin/TestFormModal.svelte          # Test form modal
        admin/fields/AdminTextField.svelte  # Text input field
        admin/fields/AdminNumberField.svelte # Number input field
        admin/fields/AdminSelectField.svelte # Select dropdown field
        admin/fields/AdminRelationshipField.svelte # Relationship field
        admin/fields/AdminTextareaField.svelte # Textarea field
        admin/fields/AdminBooleanField.svelte # Boolean toggle field
        
        # Specialized Components (7+)
        audio/AudioRecorder.svelte    # Audio recording widget
        chat/ChatThread.svelte        # Complete chat interface with AI integration
        chat/ChatMessageList.svelte   # Message display
        chat/ChatMessageBubble.svelte # Individual message
        chat/ChatComposer.svelte      # Message input
        search/SearchBox.svelte       # Autocomplete search input
        search/SearchResults.svelte   # Search results display
      
      ts/                 # TypeScript logic and features
        main.ts           # Renderer entry point
        app.d.ts          # Global type declarations
        vite-env.d.ts     # Vite environment types
        
        features/         # 16 feature modules (business logic)
          router/         # Hash-based routing with type safety
            types.ts      # Route union type (19 routes)
            service.ts    # Navigation functions
            store.ts      # Current route state
          
          settings/       # Application settings
            types.ts      # Settings schema (locale, theme)
            service.ts    # IPC integration + localStorage fallback
            store.ts      # Reactive settings state
            index.ts      # Barrel export
          
          ui/             # Global UI state
            service.ts    # Theme application, modal/sidebar control
            store.ts      # UI state (sidebar, modal, theme)
          
          i18n/           # Internationalization
            types.ts      # Locale types
            service.ts    # Translation functions
            store.ts      # Current locale and t() function
            utils.ts      # Message path utilities
            index.ts      # Barrel export
            locales/
              en.json     # English translations
              fr.json     # French translations
          
          browse/         # File browsing
            types.ts      # Browse item interface
            service.ts    # Path operations
            store.ts      # Current path and items
          
          files-access/   # File picker integration
            types.ts      # File access types, UI mapping
            service.ts    # File processing, format conversion
            store.ts      # Picked files state management
          
          admin/            # AI entity management system
            types.ts        # Entity types (Provider, Model, Agent)
            service.ts      # CRUD operations with browser/electron services
            electron-service.ts # Electron-specific admin operations
            browser-service.ts # Browser fallback implementation
            store.ts        # Reactive stores for admin data
            relationship-utils.ts # Reusable relationship field utilities
          
          ai-communication/ # Live AI integration system
            types.ts        # AI message and response types
            manager.ts      # Central AI communication coordinator
            service.ts      # AI interaction service layer
            store.ts        # Conversation state management
            adapters/       # Provider-specific adapters
              base.ts       # Base adapter interface
              openai.ts     # OpenAI API adapter
              anthropic.ts  # Anthropic API adapter
            utils/          # AI utility functions
              message-formatter.ts # Message preparation
              response-parser.ts # Response processing
          
          db/             # Database operations
            types.ts      # Database schema types
            service.ts    # CRUD operations via IPC
            electron-service.ts # Electron-specific database operations
            browser-service.ts # Browser REST API fallback
            store.ts      # Table state with staged editing
          
          search/         # Search infrastructure
            types.ts      # Search suggestion types
            service.ts    # Search operations
            store.ts      # Search state
          
          chatbot/        # Chat functionality
            types.ts      # Message and thread types
            service.ts    # Chat operations
            store.ts      # Conversation state
          
          navigation/     # Hierarchical menu system
            types.ts      # MenuItem interface
            service.ts    # Menu operations  
            store.ts      # Navigation state
          
          discussion/     # AI-powered discussion threads
            types.ts      # Discussion and message types
            service.ts    # Discussion operations
            store.ts      # Discussion state management
            chatbot-bridge.ts # AI integration bridge
            state-manager.ts # State coordination
            utils.ts      # Helper functions
            electron-service.ts # Electron implementation
            browser-service.ts # Browser fallback
          
          computer-capture/  # Screen capture capabilities
            types.ts      # Capture types and interfaces
            service.ts    # Capture operations
            store.ts      # Capture state
            utils.ts      # Capture utilities
          
          config-manager/  # Configuration management
            types.ts      # Config types
            service.ts    # Config operations
            store.ts      # Config state
            index.ts      # Public API
          
          config/         # Application configuration
            types.ts      # Config schema
            service.ts    # Config access
            store.ts      # Config state
            index.ts      # Public exports
          
          environment.ts  # Environment detection and utilities
      
      styles/             # SCSS design system
        global.scss       # Entry point
        base/
          _variables.scss # Design tokens
          _layout.scss    # Grid, flexbox utilities
          _elements.scss  # Base element styles
          _mixins.scss    # Reusable mixins
          _motion.scss    # Animation utilities
        components/
          _controls.scss  # Form controls
          _table.scss     # Data table styles
          _nav-tree.scss  # Navigation styles
          _progress.scss  # Progress indicators
          _layout-components.scss # Layout component styles

packages/db/              # Database workspace package
  src/db/
    client.ts           # Drizzle database client
    schema.ts           # Database schema definition
  drizzle/              # Generated migrations
  drizzle.config.ts     # Drizzle configuration
```

## Architecture Principles

### Component Design
- **Reusable**: All components designed for multiple contexts
- **Accessible**: Full ARIA support, keyboard navigation
- **Configurable**: Rich prop APIs with sensible defaults
- **Type-safe**: Complete TypeScript interfaces for props/events
- **i18n Ready**: All text content via configurable labels

### Feature Architecture
Each feature follows consistent structure:
```typescript
features/<name>/
  types.ts    // TypeScript interfaces and types
  service.ts  // Business logic, IPC calls, pure functions
  store.ts    // Svelte reactive stores, state management
```

### View Composition
- **Thin views**: Minimal logic, focus on component composition
- **Feature integration**: Connect UI to feature stores/services
- **Consistent patterns**: Standard i18n subscription, cleanup on destroy

### Path Aliases (Vite + TypeScript)
```typescript
@renderer/*   → app/renderer/src/*
@views/*      → app/renderer/src/views/*
@ts/*         → app/renderer/src/ts/*
@features/*   → app/renderer/src/ts/features/*
@components/* → app/renderer/src/components/*
```

## Process Communication

### Main Process Capabilities
- **Window Management**: BrowserWindow lifecycle, dev/production loading
- **Database**: SQLite operations, schema migrations via Drizzle
- **File System**: Directory listing, file access with security validation
- **Settings**: Persistent configuration storage in userData directory
- **Native Menu**: Localized application menu with dev/production gating

### Preload Security Bridge
Exposes comprehensive, typed API surface via `contextBridge`:
```typescript
window.gc = {
  settings: {
    all(): Promise<AppSettings>
    get<K>(key: K): Promise<AppSettings[K]>
    set<K>(key: K, value: AppSettings[K]): Promise<AppSettings>
    subscribe(callback: (settings: AppSettings) => void): () => void
  }
  fs: {
    listDirectory(path: string): Promise<FileItem[]>
  }
  db: {
    test: {
      list(filters?: TestFilters): Promise<TestRow[]>
      insert(data: TestInsert): Promise<TestRow>
      update(data: TestUpdate): Promise<TestRow>
      delete(id: number): Promise<void>
      truncate(): Promise<void>
    }
    providers: {
      list(filters?: ProviderFilters): Promise<Provider[]>
      insert(data: ProviderInsert): Promise<Provider>
      update(data: ProviderUpdate): Promise<Provider>
      delete(id: number): Promise<void>
    }
    models: {
      list(filters?: ModelFilters): Promise<Model[]>
      insert(data: ModelInsert): Promise<Model>
      update(data: ModelUpdate): Promise<Model>
      delete(id: number): Promise<void>
    }
    agents: {
      list(filters?: AgentFilters): Promise<Agent[]>
      insert(data: AgentInsert): Promise<Agent>
      update(data: AgentUpdate): Promise<Agent>
      delete(id: number): Promise<void>
    }
  }
}
```

### Renderer Security Model
- **No Node.js Access**: `nodeIntegration: false`, `contextIsolation: true`
- **Preload Only**: All system access through whitelisted IPC bridge
- **Type Safety**: Complete TypeScript interfaces for all IPC operations

## Data Management

### Database (SQLite + Drizzle)
- **Location**: `packages/db/data/gcomputer.db`
- **Schema**: Type-safe via Drizzle ORM with comprehensive data model
- **Production Tables**: 
  - AI Management: `ai_providers`, `ai_models`, `ai_agents` with relationships
  - Discussion System: `discussions`, `messages` with cascade deletion
  - Test Table: `test` for development
- **Migrations**: Generated via `drizzle-kit generate`
- **Dual Access**: IPC bridge (Electron) + REST API (browser) at localhost:3001
- **Service Layer**: Shared business logic between IPC and REST endpoints
- **Planned Tables**: `files`, `file_vectors`, `tags`, `actions`, `permissions`

### Settings Persistence
- **Storage**: `userData/settings.json` with schema validation
- **Fallback**: localStorage for development/graceful degradation
- **Schema**: Versioned with migration support
- **Sync**: Real-time updates between main/renderer processes

### State Management
- **Svelte Stores**: Reactive state with explicit subscription management
- **Feature Isolation**: Each feature manages its own state
- **Type Safety**: All store interfaces explicitly typed
- **Cleanup**: Proper unsubscribe patterns in all components

## Internationalization

### Scope
- **Languages**: English (primary), French (complete)
- **Coverage**: All UI text, menu items, component labels, error messages
- **Architecture**: Separate main process (menu) and renderer (UI) catalogs

### Implementation
- **Pattern**: Consistent `t(key, params?)` function usage
- **Loading**: JSON catalogs bundled with renderer
- **Fallback**: English when translation missing
- **Dynamic**: Runtime locale switching with immediate UI updates

## Routing & Navigation

### Hash Router
- **Type Safety**: Route union type with 27 defined routes
- **Dev Gating**: Development routes hidden in production via `import.meta.env.DEV`
- **Navigation**: Programmatic via `navigate(route)` function
- **State**: Current route reactive store with cleanup
- **Route Categories**:
  - Core: `home`, settings (config, about)
  - Admin: AI entity management (provider, model, agent)
  - Discussion: Thread list, new discussion, chat view
  - Development: Styleguide, features, testing views
  - AI: Communication testing and configuration

### Menu System
- **Hierarchical**: Recursive `MenuItem` structure via `NavTree` component
- **Controlled**: Supports both controlled and uncontrolled expand/navigation
- **Responsive**: Collapsible sidebar with state persistence

## Build System

### Development (`npm run dev`)
- **Concurrently**: Vite (renderer) + esbuild watch (main/preload) + Electron
- **Hot Reload**: Renderer automatic, main/preload requires restart
- **Port**: 5173 (configurable in vite.config.mts)

### Production (`npm run build`)
- **Outputs**: 
  - Main: `dist/main/index.cjs`
  - Preload: `dist/preload/index.cjs`
  - Renderer: `dist/renderer/`
- **Optimization**: Tree shaking, minification, source maps

### Additional Commands
```bash
npm run typecheck         # TypeScript validation
npm run rebuild:native    # Rebuild native modules (post-install)

# Database tools (workspace commands)
npm --workspace @gcomputer/db run drizzle:studio
npm --workspace @gcomputer/db run drizzle:generate
```

## Styling Architecture

### Design System
- **Tokens**: CSS custom properties in `_variables.scss`
- **Utilities**: Tailwind CSS for rapid development
- **Components**: SCSS partials for complex component styles
- **Themes**: `data-theme` attribute switching (light/dark/fun)

### Organization
- **Global**: Tokens, resets, utilities in `styles/base/`
- **Components**: Reusable styles in `styles/components/`
- **No Inline**: Components use utility classes, no `<style>` blocks

## Future Extensibility

### "Everything App" Foundation
The architecture is designed to scale toward the ultimate vision:

- **Component Reusability**: Table handles any dataset, SearchBox ready for universal search
- **Feature Patterns**: Consistent structure enables rapid capability addition
- **IPC Extensibility**: Security model ready for screen capture, OS automation
- **Database Schema**: Prepared for file indexing, embeddings, permissions
- **Type Safety**: Robust foundation for complex feature interactions

## AI Communication System

### Architecture
The AI communication system provides live integration with external AI providers through a modular adapter architecture:

- **AICommunicationManager**: Central coordinator for all AI interactions
- **Provider Adapters**: Specialized adapters for different AI services (OpenAI, Anthropic)
- **Message Management**: Standardized message formatting with system prompts
- **Streaming Support**: Real-time response streaming for enhanced user experience

### Provider Adapter Pattern
```typescript
interface ProviderAdapter {
  sendMessage(messages: AIMessage[], options: CommunicationOptions): Promise<AIResponse>
  streamMessage(messages: AIMessage[], options: CommunicationOptions): AsyncIterableIterator<StreamEvent>
  validateConfiguration(): Promise<boolean>
}
```

### Features
- **Multi-Provider Support**: Extensible architecture supports OpenAI, Anthropic, and custom providers
- **Configuration Management**: Dynamic provider/model configuration via admin system
- **Type Safety**: Complete TypeScript interfaces for all AI interactions
- **Error Handling**: Robust error handling with validation and fallbacks
- **Conversation Management**: Stateful conversation handling with message history

### Planned Capabilities
- Enhanced multi-turn conversations with persistence
- File system indexing and semantic search
- Screen understanding and automation
- Voice interactions and AI integration
- Cross-application control with granular permissions
- Local-first data processing with optional cloud sync