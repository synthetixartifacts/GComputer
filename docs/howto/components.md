# Component Library API Reference

## Overview

GComputer includes 16 production-ready components organized into categories:
- **Core Layout** (6): Header, Footer, Sidebar, Drawer, Modal, ProgressBar
- **Data Display** (6): Table, FileList, FileGrid, GalleryGrid, ImageCard, ViewToggle
- **Navigation** (1): NavTree  
- **Specialized** (3): audio/AudioRecorder, chat/* (4 components), search/* (2 components)

All components follow consistent patterns:
- **TypeScript**: Full prop/event type safety
- **i18n Ready**: Configurable labels for all text
- **Accessible**: ARIA support and keyboard navigation
- **Reusable**: Designed for multiple contexts

---

## Core Layout Components

### Modal
**Accessible modal dialog with focus trapping**

```svelte
<script lang="ts">
  import Modal from '@components/Modal.svelte';
  let modalOpen = false;
</script>

<Modal 
  open={modalOpen} 
  onClose={() => modalOpen = false}
  title="pages.modal.title"
>
  <p>Modal content goes here</p>
  <button on:click={() => modalOpen = false}>Close</button>
</Modal>
```

**Props:**
- `open: boolean` - Whether modal is visible
- `onClose: () => void` - Callback to close modal
- `title: string` - i18n key for modal title (used for aria-labelledby)

**Features:**
- Focus trap: Focus cycles within modal when open
- Keyboard support: ESC closes, TAB navigation contained
- Backdrop click: Clicking outside closes modal
- Auto-focus: First focusable element gets focus on open

### Header
**Application header with theme toggle and sidebar control**

```svelte
<script lang="ts">
  import Header from '@components/Header.svelte';
</script>

<Header 
  title="app.title"
  theme="light"
  onToggleTheme={() => {/* theme cycling logic */}}
  onToggleSidebar={() => {/* sidebar toggle logic */}}
/>
```

**Props:**
- `title: string` - i18n key for app title
- `theme: 'light' | 'dark' | 'fun'` - Current theme (affects icon display)
- `onToggleTheme: () => void` - Theme cycling callback
- `onToggleSidebar: () => void` - Sidebar toggle callback

---

## Data Display Components

### Table
**Advanced data table with filtering, sorting, and inline editing**

```svelte
<script lang="ts">
  import Table from '@components/Table.svelte';
  
  type Row = { id: number; name: string; age: number; email: string };
  
  let rows: Row[] = [];
  let filters: Record<string, string> = {};
  let editingRowIds: Set<number> = new Set();
  
  const columns = [
    { 
      id: 'name', 
      title: 'Name', 
      editable: true,
      width: '200px',
      placeholder: 'Enter name...'
    },
    { 
      id: 'age', 
      title: 'Age', 
      editable: true,
      filterType: 'number' as const
    },
    {
      id: 'email',
      title: 'Email',
      filterable: true,
      sortable: true
    }
  ] satisfies ColumnDef<Row>[];
</script>

<Table
  {rows}
  {columns}
  {filters}
  {editingRowIds}
  on:filterChange={(e) => filters = { ...filters, [e.detail.columnId]: e.detail.value }}
  on:editCell={(e) => {/* handle cell edit */}}
  on:toggleEdit={(e) => {/* toggle row editing */}}
  on:deleteRow={(e) => {/* handle row deletion */}}
  density="regular"
  enableSorting={true}
  showDefaultActions={true}
  labels={{
    edit: 'Edit',
    done: 'Done', 
    delete: 'Delete',
    clearFilters: 'Clear all',
    clearFilter: 'Clear'
  }}
  emptyMessage="No data available"
>
  <svelte:fragment slot="header-actions">
    <button class="btn btn--primary">Add Row</button>
  </svelte:fragment>
  
  <svelte:fragment slot="actions" let:row>
    <button class="btn btn--sm">Custom Action</button>
  </svelte:fragment>
</Table>
```

**Key Props:**
- `columns: ColumnDef<T>[]` - Column definitions with types, editability, filtering
- `rows: Array<{ id: number; [key: string]: any }>` - Data rows (id required)
- `filters: Record<string, string>` - Current filter values (controlled)
- `editingRowIds: Set<number>` - Row IDs currently in edit mode
- `density: 'regular' | 'compact'` - Row spacing
- `enableSorting: boolean` - Enable column sorting
- `showDefaultActions: boolean` - Show built-in edit/delete actions
- `labels: object` - i18n labels for actions

**Column Definition:**
```typescript
interface ColumnDef<TRow> {
  id: keyof TRow & string;           // Column identifier
  title: string;                     // Display name
  editable?: boolean;                // Enable inline editing
  width?: string;                    // CSS width
  placeholder?: string;              // Edit mode placeholder
  sortable?: boolean;                // Enable sorting (default: true)
  filterable?: boolean;              // Enable filtering (default: true)
  filterType?: 'text' | 'number' | 'date' | 'select';
  filterOptions?: Array<{ label: string; value: string }>;
  access?: (row: TRow) => string | number | null;
  sortAccessor?: (row: TRow) => string | number | null;
}
```

**Events:**
- `filterChange: { columnId: string, value: string }` - Filter value changed
- `editCell: { rowId: number, columnId: string, value: string }` - Cell edited
- `toggleEdit: { rowId: number }` - Row edit mode toggled
- `deleteRow: { rowId: number }` - Row deletion requested

### FileList
**Smart file display component (wraps Table for file-specific UX)**

```svelte
<script lang="ts">
  import FileList from '@components/FileList.svelte';
  import type { UiFileItem } from '@features/files-access/types';
  
  let files: UiFileItem[] = [];
</script>

<FileList
  {files}
  showLocation={true}
  showViewToggle={true}
  initialMode="list"
  enableSorting={true}
  density="regular"
  emptyMessage="No files to display"
/>
```

**Props:**
- `files: UiFileItem[]` - File items to display
- `showLocation: boolean` - Show file location column
- `showViewToggle: boolean` - Show list/grid toggle
- `initialMode: 'list' | 'grid'` - Initial view mode
- `enableSorting: boolean` - Enable table sorting
- `density: 'regular' | 'compact'` - Row spacing
- `emptyMessage: string | null` - Custom empty state message

**Features:**
- Automatic file type detection from extensions
- Size formatting (bytes → KB/MB/GB)
- Date formatting (ISO → readable)
- View mode switching (list table ↔ grid)
- Built-in filtering and sorting

---

## Navigation Components

### NavTree
**Recursive navigation tree with controlled/uncontrolled patterns**

```svelte
<script lang="ts">
  import NavTree from '@components/NavTree.svelte';
  import type { MenuItem } from '@features/navigation/types';
  
  const menuItems: MenuItem[] = [
    {
      label: 'Features',
      items: [
        { label: 'Local Files', route: 'test.features.local-files' },
        { label: 'Database', route: 'test.db.test-table' }
      ]
    },
    { label: 'Settings', route: 'settings.config' }
  ];
</script>

<!-- Uncontrolled (uses internal stores) -->
<NavTree 
  items={menuItems}
  onNavigate={() => {/* handle navigation complete */}}
/>

<!-- Controlled -->
<NavTree
  items={menuItems}
  currentRoute={controlledRoute}
  expanded={controlledExpanded}
  onToggleExpand={(label, isExpanded) => {/* handle expand */}}
  onNavigateRoute={(route) => {/* handle navigation */}}
/>
```

**Props:**
- `items: MenuItem[]` - Hierarchical menu structure
- `onNavigate: () => void` - Called after successful navigation
- `currentRoute?: Route` - Controlled active route (optional)
- `expanded?: Record<string, boolean>` - Controlled expand state (optional)
- `onToggleExpand?: (label: string, expanded: boolean) => void` - Controlled expand handler
- `onNavigateRoute?: (route: Route) => void` - Controlled navigation handler

**MenuItem Interface:**
```typescript
interface MenuItem {
  label: string;                    // Display text (i18n key)
  route?: Route;                    // Target route (leaf items)
  items?: MenuItem[];               // Child items (branches)
}
```

---

## Specialized Components

### SearchBox  
**Autocomplete search input with keyboard navigation**

```svelte
<script lang="ts">
  import SearchBox from '@components/search/SearchBox.svelte';
  import type { Suggestion } from '@features/search/types';
  
  let searchValue = '';
  let suggestions: Suggestion[] = [];
  let activeIndex: number | null = null;
</script>

<SearchBox
  value={searchValue}
  {suggestions}
  {activeIndex}
  placeholder="Search everything..."
  minChars={2}
  maxSuggestions={8}
  autoFocus={true}
  showClear={true}
  labels={{ clear: 'Clear search', suggestions: 'Suggestions' }}
  on:input={(e) => searchValue = e.detail}
  on:submit={(e) => {/* handle search submit */}}
  on:selectSuggestion={(e) => {/* handle suggestion selection */}}
  on:arrowUp={() => {/* handle up arrow */}}
  on:arrowDown={() => {/* handle down arrow */}}
  on:clear={() => searchValue = ''}
/>
```

**Props:**
- `value: string` - Current search value (controlled)
- `suggestions: Suggestion[]` - Available suggestions
- `activeIndex: number | null` - Currently highlighted suggestion
- `placeholder: string` - Input placeholder
- `minChars: number` - Minimum characters to show suggestions
- `maxSuggestions: number` - Maximum suggestions to display
- `autoFocus: boolean` - Auto-focus input on mount
- `showClear: boolean` - Show clear button when value exists
- `labels: object` - i18n labels

**Events:**
- `input: string` - Search value changed
- `submit: string` - Search submitted (Enter key or button)
- `selectSuggestion: Suggestion` - Suggestion selected
- `arrowUp/arrowDown: void` - Keyboard navigation
- `clear: void` - Clear button clicked
- `focus/blur: void` - Input focus events

### AudioRecorder
**Audio recording widget with permission handling**

```svelte
<script lang="ts">
  import AudioRecorder from '@components/audio/AudioRecorder.svelte';
</script>

<AudioRecorder
  size="md"
  labels={{
    record: 'Record',
    stop: 'Stop', 
    play: 'Play',
    pause: 'Pause',
    download: 'Download'
  }}
  on:recordingComplete={(e) => {
    const audioBlob = e.detail;
    // Handle completed recording
  }}
/>
```

**Props:**
- `size: 'sm' | 'md' | 'lg'` - Visual size variant
- `labels: object` - i18n labels for controls

**Events:**
- `recordingComplete: Blob` - Audio recording finished

**Features:**
- Microphone permission request
- Visual recording state indicators
- Playback controls for recorded audio
- Download functionality
- Error state handling

---

## Usage Patterns

### i18n Integration
All components use consistent i18n patterns:

```svelte
<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  import { onDestroy } from 'svelte';
  
  let t: (key: string) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());
</script>

<Modal title={t('modal.title')} />
```

### Event Handling
Components emit typed events for type-safe handling:

```svelte
<Table 
  on:editCell={(e) => {
    const { rowId, columnId, value } = e.detail;
    // TypeScript knows the event shape
  }}
/>
```

### Styling
Components use utility classes and CSS custom properties:
- Utility-first: Tailwind classes for layout/spacing
- Themeable: CSS custom properties for colors
- Consistent: Shared design tokens from `_variables.scss`