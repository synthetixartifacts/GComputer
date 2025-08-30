<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { t as tStore } from '@ts/i18n/store';
  import AdminBooleanField from '@components/admin/fields/AdminBooleanField.svelte';
  import AdminSelectField from '@components/admin/fields/AdminSelectField.svelte';
  import type { AdminFieldConfig } from '@features/admin/types';
  
  let enabled = true;
  let shortcut = 'Alt+Space';
  let enabledActions: string[] = [];
  let loading = false;
  let saveStatus = '';
  
  // Available actions with their labels
  const availableActions = [
    { id: 'translate', label: 'Translate' },
    { id: 'fix-grammar', label: 'Fix Grammar' },
    { id: 'summarize', label: 'Summarize' },
    { id: 'explain', label: 'Explain' },
    { id: 'screenshot', label: 'Screenshot' },
    { id: 'copy', label: 'Copy' },
    { id: 'paste', label: 'Paste' }
  ];
  
  // Shortcut options
  const shortcutOptions = [
    { value: 'Alt+Space', label: 'Alt + Space' },
    { value: 'F5', label: 'F5' },
    { value: 'F6', label: 'F6' },
    { value: 'CommandOrControl+Shift+G', label: 'Ctrl/Cmd + Shift + G' },
    { value: 'CommandOrControl+Shift+M', label: 'Ctrl/Cmd + Shift + M' }
  ];
  
  // Field configurations
  const enabledField: AdminFieldConfig<any> = {
    id: 'enabled',
    title: 'Enable Context Menu',
    type: 'boolean',
    helpText: 'Enable or disable the global context menu'
  };
  
  const shortcutField: AdminFieldConfig<any> = {
    id: 'shortcut',
    title: 'Keyboard Shortcut',
    type: 'select',
    options: shortcutOptions,
    helpText: 'Choose the keyboard shortcut to trigger the context menu'
  };
  
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  
  onMount(async () => {
    await loadConfiguration();
  });
  
  onDestroy(() => {
    unsubT();
  });
  
  async function loadConfiguration() {
    loading = true;
    try {
      const result = await window.gc?.context?.getConfig();
      if (result?.success && result.config) {
        enabled = result.config.enabled;
        shortcut = result.config.shortcut;
        enabledActions = result.config.actions || [];
      }
    } catch (error) {
      console.error('Failed to load context menu configuration:', error);
    } finally {
      loading = false;
    }
  }
  
  async function handleEnabledChange(event: CustomEvent) {
    enabled = event.detail.value;
    await saveConfiguration();
  }
  
  async function handleShortcutChange(event: CustomEvent) {
    shortcut = event.detail.value;
    await saveConfiguration();
  }
  
  async function handleActionToggle(actionId: string) {
    if (enabledActions.includes(actionId)) {
      enabledActions = enabledActions.filter(id => id !== actionId);
    } else {
      enabledActions = [...enabledActions, actionId];
    }
    await saveConfiguration();
  }
  
  async function saveConfiguration() {
    loading = true;
    saveStatus = 'Saving...';
    
    try {
      const result = await window.gc?.context?.updateConfig({
        enabled,
        shortcut,
        actions: enabledActions
      });
      
      if (result?.success) {
        saveStatus = 'Saved successfully';
        setTimeout(() => {
          saveStatus = '';
        }, 2000);
      } else {
        saveStatus = 'Failed to save';
      }
    } catch (error) {
      console.error('Failed to save context menu configuration:', error);
      saveStatus = 'Error saving configuration';
    } finally {
      loading = false;
    }
  }
</script>

<section class="stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.settings.contextMenu.title')}</h2>
  <p class="text-gray-600 dark:text-gray-400">{t('pages.settings.contextMenu.desc')}</p>
  
  {#if loading && !saveStatus}
    <div class="text-gray-500">Loading configuration...</div>
  {:else}
    <div class="space-y-6">
      <!-- Enable/Disable Toggle -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <AdminBooleanField 
          field={enabledField} 
          value={enabled} 
          disabled={loading}
          on:change={handleEnabledChange}
        />
      </div>
      
      {#if enabled}
        <!-- Keyboard Shortcut Selection -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <AdminSelectField 
            field={shortcutField} 
            value={shortcut} 
            disabled={loading}
            on:change={handleShortcutChange}
          />
        </div>
        
        <!-- Actions Selection -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold mb-3">{t('pages.settings.contextMenu.enabledActions')}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('pages.settings.contextMenu.actionsHelp')}
          </p>
          
          <div class="space-y-2">
            {#each availableActions as action}
              <label class="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={enabledActions.includes(action.id)}
                  disabled={loading}
                  on:change={() => handleActionToggle(action.id)}
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span class="flex-1">{action.label}</span>
              </label>
            {/each}
          </div>
        </div>
      {/if}
      
      <!-- Save Status -->
      {#if saveStatus}
        <div class="text-sm {saveStatus.includes('success') ? 'text-green-600' : 'text-red-600'}">
          {saveStatus}
        </div>
      {/if}
    </div>
  {/if}
</section>