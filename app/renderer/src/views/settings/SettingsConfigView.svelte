<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { setLocale as setLocaleSetting, setThemeMode as setThemeSetting } from '@features/settings/service';
  import { settingsStore } from '@features/settings/store';
  import type { ThemeMode, Locale } from '@features/settings/types';
  import { t as tStore } from '@ts/i18n/store';
  import { getConfigurationByCode, updateConfigurationByCode } from '@features/admin/service';

  let theme: ThemeMode = 'light';
  let locale: Locale = 'en';
  let loadingTheme = false;
  let loadingLocale = false;
  
  // Load configuration values from database
  onMount(async () => {
    try {
      const themeConfig = await getConfigurationByCode('theme_mode');
      const localeConfig = await getConfigurationByCode('locale');
      
      if (themeConfig) {
        theme = themeConfig.value as ThemeMode;
      }
      if (localeConfig) {
        locale = localeConfig.value as Locale;
      }
    } catch (error) {
      console.error('Failed to load configurations:', error);
    }
  });
  
  const unsub = settingsStore.subscribe((s) => {
    theme = s.themeMode;
    locale = s.locale;
  });
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsub());
  onDestroy(() => unsubT());

  async function onThemeChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value as ThemeMode;
    loadingTheme = true;
    try {
      // Update in settings (for immediate UI update)
      await setThemeSetting(value);
      // Also update in configuration table
      await updateConfigurationByCode('theme_mode', value);
    } catch (error) {
      console.error('Failed to update theme:', error);
    } finally {
      loadingTheme = false;
    }
  }

  async function onLocaleChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value as Locale;
    loadingLocale = true;
    try {
      // Update in settings (for immediate UI update)
      await setLocaleSetting(value);
      // Also update in configuration table
      await updateConfigurationByCode('locale', value);
    } catch (error) {
      console.error('Failed to update locale:', error);
    } finally {
      loadingLocale = false;
    }
  }
</script>

<section class="stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.settings.config.title')}</h2>
  <p>{t('pages.settings.config.desc')}</p>

  <div class="grid gap-4 max-w-md">
    <label class="field">
      <span class="field__label">{t('pages.settings.config.theme')}</span>
      <select class="input" on:change={onThemeChange} bind:value={theme} disabled={loadingTheme}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="fun">Fun</option>
      </select>
      {#if loadingTheme}
        <span class="text-sm text-gray-500">Saving...</span>
      {/if}
    </label>

    <label class="field">
      <span class="field__label">{t('pages.settings.config.language')}</span>
      <select class="input" on:change={onLocaleChange} bind:value={locale} disabled={loadingLocale}>
        <option value="en">English</option>
        <option value="fr">Français</option>
      </select>
      {#if loadingLocale}
        <span class="text-sm text-gray-500">Saving...</span>
      {/if}
    </label>
  </div>
</section>


