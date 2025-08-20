# Screen Capture Components Documentation

## Overview

The screen capture feature uses two simple, focused components that separate UI (preview/selection) from logic (capture). This provides a clean, DRY architecture for screen capture functionality.

## Component Architecture (Only 2 Core Components)

### 1. LiveScreenPreview Component
**Location**: `app/renderer/src/components/computer/LiveScreenPreview.svelte`

UI component for display selection and live preview.

**Props**:
- `selectedDisplay`: Currently selected display ('all' or display ID)
- `onSelectionChange`: Callback when display selection changes
- `autoStart`: Whether to start preview automatically (default: true)
- `showControls`: Whether to show selection controls (default: true)

**Methods**:
- `stopPreviews()`: Stop all video streams
- `restartPreviews()`: Restart video streams
- `getDisplays()`: Get available displays

**Usage Example**:
```svelte
<LiveScreenPreview
  savePath="/custom/path"
  autoStart={true}
  showControls={true}
  onSelectionChange={(selection) => {
    console.log('Selected:', selection.displayId);
  }}
/>
```

### 2. CaptureScreen Component
**Location**: `app/renderer/src/components/computer/CaptureScreen.svelte`

Headless logic component for screen capture.

**Props**:
- `onCaptureComplete`: Callback when capture completes
- `onCaptureStart`: Callback when capture starts

**Methods**:
- `capture(displayId, savePath?)`: Trigger capture
- `isReady()`: Check if ready to capture
- `getError()`: Get current error state
- `clearError()`: Clear error state

**Usage Example**:
```svelte
<script>
  let captureScreen;
  
  // Capture programmatically
  async function captureNow() {
    await captureScreen.capture({
      displayId: 'screen:0:0',
      savePath: '/custom/path'
    });
  }
</script>

<CaptureScreen
  bind:this={captureScreen}
  displayId="all"
  onCaptureComplete={(success, error) => {
    if (success) {
      console.log('Capture successful!');
    } else {
      console.error('Capture failed:', error);
    }
  }}
/>
```

## Supporting Components

### ScreenSelectionModal Component
**Location**: `app/renderer/src/components/computer/ScreenSelectionModal.svelte`

Modal wrapper that combines the two core components.

**Props**:
- `open`: Whether modal is open
- `onClose`: Callback when modal closes
- `savePath`: Optional save path

## Usage Patterns

### Pattern 1: Modal-Based Capture (Most Common)
```svelte
<script>
  let showModal = false;
</script>

<button on:click={() => showModal = true}>
  Capture Screen
</button>

<ScreenSelectionModal 
  open={showModal}
  onClose={() => showModal = false}
/>
```

### Pattern 2: Direct Component Usage
```svelte
<script>
  let selectedDisplay = 'all';
  let captureScreen;
  
  async function handleCapture() {
    await captureScreen.capture(selectedDisplay);
  }
</script>

<LiveScreenPreview
  bind:selectedDisplay
  onSelectionChange={(id) => selectedDisplay = id}
/>

<button on:click={handleCapture}>Capture</button>

<CaptureScreen bind:this={captureScreen} />
```

### Pattern 3: Programmatic Capture
```svelte
<script>
  import CaptureScreen from '@components/computer/CaptureScreen.svelte';
  
  let captureComponent;
  
  // Capture programmatically
  async function captureAll() {
    await captureComponent.capture('all');
  }
</script>

<CaptureScreen bind:this={captureComponent} />
```

## Benefits of Simplified Architecture

1. **Simple & DRY**: Only 2 core components, no duplication
2. **Clear Separation**: UI (LiveScreenPreview) vs Logic (CaptureScreen)
3. **Flexible**: Can be used in modals, inline, or programmatically
4. **Maintainable**: Less code to maintain
5. **Testable**: Logic component can be tested independently

## File Structure

```
app/renderer/src/
├── components/computer/
│   ├── LiveScreenPreview.svelte    # UI component
│   ├── CaptureScreen.svelte        # Logic component
│   └── ScreenSelectionModal.svelte # Modal wrapper
└── views/development/features/
    └── FeatureCaptureScreenView.svelte # Main view
```

## Main View

The main view (`FeatureCaptureScreenView`) provides:
- Gallery of captured screenshots
- Record button to open capture modal
- Screenshot management (view, download, delete)
- Accessible via: Development > Features > Capture Screen