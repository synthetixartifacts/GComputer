# Main Process Architecture

This directory contains the Electron main process code, organized following best practices for maintainability and separation of concerns.

## Directory Structure

```
app/main/
├── main.ts              # Entry point - orchestrates initialization
├── environment.ts       # Environment configuration
├── window.ts           # Window management
├── initialization.ts   # Application initialization orchestrator
├── ipc.ts             # IPC handler registration
├── display-media.ts   # Display media handling for screen capture
├── settings.ts        # Settings persistence
├── fs.ts             # File system operations
├── screen-capture.ts # Screen capture functionality
├── menu.ts           # Application menu
├── api-server.ts     # REST API server
├── db.ts             # Database initialization
├── db/               # Database layer
│   ├── handlers/     # IPC handlers for DB operations
│   ├── services/     # Business logic services
│   ├── seeding.ts    # Default data seeding
│   └── types.ts      # TypeScript types
├── i18n/             # Internationalization
│   └── menu.ts       # Menu translations
└── index.ts          # Module exports
```

## Architecture Principles

### 1. Separation of Concerns
Each module has a single, well-defined responsibility:
- `main.ts` - Only orchestrates, no business logic
- `environment.ts` - Handles all environment configuration
- `window.ts` - Manages window lifecycle
- `initialization.ts` - Orchestrates feature initialization
- `ipc.ts` - Central IPC registration

### 2. DRY (Don't Repeat Yourself)
- Common functionality is extracted into reusable functions
- Configuration is centralized
- No code duplication across modules

### 3. Clean Code
- Clear, descriptive function names
- Comprehensive JSDoc comments
- Consistent error handling
- Proper TypeScript typing

### 4. Modular Design
- Each feature is self-contained
- Easy to add/remove features
- Clear dependencies between modules

## Module Descriptions

### Core Modules

#### main.ts
Entry point that orchestrates application initialization. Contains minimal code, just calls to other modules.

#### environment.ts
Handles environment variable loading and provides utility functions for environment detection.

#### window.ts
Manages the main application window, including creation, lifecycle, and state management.

#### initialization.ts
Orchestrates the initialization of all application features in the correct order.

#### ipc.ts
Central registration point for all IPC handlers, making it easy to see all available IPC channels.

#### display-media.ts
Handles display media requests for screen capture functionality, extracted from main.ts for better organization.

### Feature Modules

#### settings.ts
Manages application settings with persistence to disk and IPC handlers for renderer access.

#### fs.ts
Provides file system operations with proper error handling and security considerations.

#### screen-capture.ts
Implements screen capture functionality using native Electron APIs.

#### db.ts & db/
Database layer with:
- Service layer for business logic
- IPC handlers for renderer access
- Type definitions for type safety
- Seeding for default data

#### menu.ts
Application menu with internationalization support.

#### api-server.ts
REST API server for browser-based access to application features.

## Best Practices

1. **Error Handling**: All async operations have proper try-catch blocks
2. **Logging**: Consistent logging with module prefixes (e.g., `[environment]`, `[initialization]`)
3. **Type Safety**: Full TypeScript typing with interfaces and type definitions
4. **Security**: Context isolation, no node integration in renderer
5. **Testing**: Separate test files in `__tests__` directories
6. **Documentation**: JSDoc comments for all public functions

## Adding New Features

To add a new feature:

1. Create a new module file (e.g., `new-feature.ts`)
2. Export necessary functions/types
3. Register IPC handlers in the module's `register*Ipc()` function
4. Add registration call to `ipc.ts`
5. If needed, add initialization to `initialization.ts`
6. Export from `index.ts` if needed by other modules

## IPC Communication

All IPC channels follow a consistent naming pattern:
- `module:action` (e.g., `settings:get`, `fs:list-directory`, `screen:capture`)

IPC handlers are registered in their respective modules and centrally registered in `ipc.ts`.