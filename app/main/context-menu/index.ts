/**
 * Context Menu Module
 * Main entry point for the context menu feature
 */

export { 
  initializeContextMenu, 
  cleanupContextMenu,
  registerContextMenuIpc 
} from './ipc-handlers';

export { 
  getShortcutManager,
  ContextMenuShortcuts,
  type ShortcutConfig 
} from './shortcuts';

export { 
  getWindowManager,
  ContextMenuWindowManager,
  type WindowPosition 
} from './window-manager';

export { 
  getContextService,
  ContextAcquisitionService,
  type ContextData 
} from './context-service';

export type { ContextMenuAction } from './ipc-handlers';