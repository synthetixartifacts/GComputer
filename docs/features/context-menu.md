# Context Menu Feature

## Overview

The Context Menu is a global overlay system that provides quick access to AI-powered actions and utilities. It can be triggered from anywhere in the system via a keyboard shortcut and appears as a floating menu at the cursor position.

## Features

- **Global Keyboard Shortcut**: Alt+Space to show/hide
- **Cursor Position**: Appears at mouse cursor location
- **Keyboard Navigation**: Arrow keys, Enter, Escape
- **Shortcut Keys**: T, G, S, P for quick action selection
- **Focus Management**: Proper focus restoration without window stealing
- **Cross-Platform**: Works on macOS, Windows, and Linux

## Available Actions

### AI Actions
- **Translate** (T): Translate selected text between languages
- **Fix Grammar** (G): Correct grammar and spelling mistakes
- **Summarize** (S): Generate concise summaries of text

### Utility Actions
- **Screenshot** (P): Capture screen content

## Usage

### Basic Usage
1. Press **Alt+Space** anywhere to show the context menu
2. Use **Arrow Keys** to navigate between options
3. Press **Enter** to execute the selected action
4. Press **Escape** to close the menu

### Shortcut Keys
Instead of navigating with arrows, you can press the shortcut key directly:
- **T** for Translate
- **G** for Fix Grammar
- **S** for Summarize
- **P** for Screenshot

### Toggle Behavior
- Press **Alt+Space** again while menu is open to close it
- Context menu remembers its state and toggles appropriately

## Technical Architecture

### Components

#### Main Process (`app/main/context-menu/`)
- **`window-manager.ts`**: Core window management and lifecycle
- **`ipc-handlers.ts`**: IPC communication handlers
- **`keyboard.ts`**: Global keyboard shortcut registration

#### IPC Communication
- **`context-menu:show`**: Show menu at cursor position
- **`context-menu:hide`**: Hide the menu
- **`context-menu:action`**: Execute selected action
- **`context-menu:toggle`**: Toggle menu visibility

### Window Configuration

```typescript
new BrowserWindow({
  width: 280,
  height: 400,
  frame: false,           // No title bar
  transparent: true,      // See-through background
  alwaysOnTop: true,     // Stay above other windows
  skipTaskbar: true,     // Don't show in taskbar
  resizable: false,      // Fixed size
  webPreferences: {
    preload: path.join(__dirname, '../preload/index.cjs'),
    contextIsolation: false,  // For inline HTML
    nodeIntegration: true     // Direct IPC access
  }
})
```

### Inline HTML Approach

The context menu uses an inline HTML approach for maximum reliability and simplicity:

```typescript
const html = `
  <!DOCTYPE html>
  <html>
    <!-- Inline styles and JavaScript -->
  </html>
`;
this.overlayWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
```

**Benefits:**
- No external file dependencies
- Works in both development and production
- Immediate loading without build step coordination
- Self-contained and portable

## Key Implementation Details

### Focus Management

The context menu implements sophisticated focus management to prevent window stealing:

```typescript
// On show: Store previously focused window
this.previouslyFocusedWindow = BrowserWindow.getFocusedWindow();

// On hide: Prevent main window from stealing focus
if (contextMenuHasFocus && process.platform === 'darwin') {
  mainWindow.blur();
  app.hide(); // Briefly hide app to restore focus to previous application
}
```

### Position Calculation

Menu position is automatically adjusted to stay within screen bounds:

```typescript
private adjustPositionToScreen(position: WindowPosition, windowBounds: Rectangle): WindowPosition {
  const displays = screen.getAllDisplays();
  const currentDisplay = screen.getDisplayNearestPoint(position);
  // ... boundary checking logic
}
```

### Keyboard Handling

Global keyboard shortcuts are registered at startup:

```typescript
globalShortcut.register('Alt+Space', () => {
  contextMenuManager.toggle();
});
```

Escape key is registered dynamically when menu is shown:

```typescript
private registerEscape(): void {
  globalShortcut.register('Escape', () => {
    this.hide();
  });
}
```

## Configuration

### Adding New Actions

To add a new action to the context menu:

1. **Add to HTML template** in `window-manager.ts`:
```html
<div class="menu-item" data-action="new-action">
  <span class="menu-icon">🔧</span>
  <span class="menu-label">New Action</span>
  <span class="menu-shortcut">N</span>
</div>
```

2. **Handle in IPC handler** in `ipc-handlers.ts`:
```typescript
case 'new-action':
  // Implement action logic
  break;
```

3. **Add keyboard shortcut** to inline JavaScript:
```javascript
// In shortcut key handling
case 'N':
  executeAction('new-action');
  break;
```

### Styling

The context menu uses inline CSS with dark mode support:

```css
/* Light mode */
.context-menu {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .context-menu {
    background: #2a2a2a;
    color: #f0f0f0;
  }
}
```

## Development

### Building

The context menu is built as part of the main process:

```bash
npm run dev:main  # Development
npm run build     # Production
```

### Testing

Test the context menu functionality:

```bash
# Start development server
npm run dev

# Test keyboard shortcut
# Press Alt+Space to show menu
# Press Escape to hide menu
# Test navigation with arrow keys
# Test shortcuts with T, G, S, P keys
```

### Debugging

Enable debug logging by checking the console output:

```typescript
console.log('[context-menu] Show method called');
console.log('[context-menu] Window hidden');
```

## Troubleshooting

### Menu Not Appearing

**Symptoms**: Alt+Space doesn't show the menu

**Causes & Solutions**:
1. **Global shortcut conflict**: Another app is using Alt+Space
   - Check system shortcuts and disable conflicting ones
2. **Window creation failed**: Check console for errors
   - Restart the application
3. **Focus issues**: Main window has lost focus
   - Click on the main window first

### Menu Appears But Is Blank

**Symptoms**: Menu window shows but content is white/empty

**Causes & Solutions**:
1. **HTML loading failed**: Inline HTML didn't load properly
   - Check console for JavaScript errors
   - Restart application
2. **Security restrictions**: Context isolation blocking content
   - Verify `contextIsolation: false` in webPreferences

### Focus/Window Stealing Issues

**Symptoms**: Main window comes to front when closing menu

**Causes & Solutions**:
1. **macOS focus behavior**: System focus management interfering
   - The code includes app.hide() to handle this
2. **Multiple monitors**: Focus restoration on wrong display
   - Try moving cursor to primary display

### Keyboard Navigation Not Working

**Symptoms**: Arrow keys or shortcuts don't work

**Causes & Solutions**:
1. **Menu not focused**: Click on menu first
   - The menu auto-focuses on show
2. **Event handling broken**: JavaScript errors in inline script
   - Check browser console in menu window
3. **Key conflicts**: Other shortcuts interfering
   - Check for global shortcut conflicts

## Security Considerations

The context menu currently uses:
- `contextIsolation: false` for simplicity with inline HTML
- `nodeIntegration: true` for direct IPC access
- `sandbox: false` for full functionality

**Future Security Improvements**:
- Migrate to external HTML file with proper preload script
- Enable context isolation with secure IPC bridge
- Implement input validation for all actions

## Performance

The context menu is optimized for quick access:
- **Lazy window creation**: Window created only when first needed
- **Inline HTML**: No network requests or file loading
- **Minimal DOM**: Simple structure for fast rendering
- **Hardware acceleration**: Transparent window with GPU compositing

## Future Enhancements

### Planned Features
- Dynamic action loading from configuration
- Context-aware actions based on selected text
- Custom action plugins
- Action history and favorites
- Multiple menu layouts

### Architecture Improvements
- Secure preload script with context isolation
- External HTML file with proper build integration
- TypeScript definitions for actions
- Automated testing suite
- Performance monitoring

## API Reference

### ContextMenuWindowManager

#### Methods

##### `show(position?: WindowPosition): Promise<void>`
Shows the context menu at the specified position or cursor location.

##### `hide(): void`
Hides the context menu and restores focus.

##### `toggle(position?: WindowPosition): Promise<void>`
Toggles menu visibility - shows if hidden, hides if visible.

##### `destroy(): void`
Destroys the context menu window and cleans up resources.

#### Events

The ContextMenuWindowManager extends EventEmitter and emits:
- `shown`: When menu becomes visible
- `hidden`: When menu is hidden
- `action-executed`: When an action is performed

### IPC Events

#### From Renderer to Main
- `context-menu:action`: Execute an action
- `context-menu:hide`: Hide the menu

#### From Main to Renderer
- `context-menu:show`: Show menu with options
- `context-menu:position-update`: Update menu position

## Integration

The context menu integrates with other GComputer features:

- **AI Communication**: Actions trigger AI processing
- **Settings**: Menu behavior configurable via settings
- **Navigation**: Actions can trigger navigation changes
- **File System**: Screenshot action integrates with file handling

This documentation covers the complete context menu implementation as it currently exists in the stable, working version.