<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { initSettings, setLocale as setLocaleSetting, setThemeMode as setThemeSetting } from '@features/settings/service';
  import { settingsStore } from '@features/settings/store';
  import type { ThemeMode, Locale } from '@features/settings/types';
  import { t as tStore } from '@features/i18n/store';
  import { initI18n, setLocale as setI18nLocale } from '@features/i18n/service';

  let theme: ThemeMode = 'light';
  let locale: Locale = 'en';
  const unsub = settingsStore.subscribe((s) => {
    theme = s.themeMode;
    locale = s.locale;
  });
  $: t = $tStore;

  onMount(async () => {
    await initSettings();
    await initI18n(locale);
  });
  onDestroy(() => unsub());

  async function onThemeChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value as ThemeMode;
    await setThemeSetting(value);
  }

  async function onLocaleChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value as Locale;
    await setLocaleSetting(value);
    setI18nLocale(value);
  }
</script>

<section class="container-page stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.settings.config.title')}</h2>
  <p>{t('pages.settings.config.desc')}</p>

  <div class="grid gap-4 max-w-md">
    <label class="field">
      <span class="field__label">{t('pages.settings.config.theme')}</span>
      <select class="input" on:change={onThemeChange} bind:value={theme}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="fun">Fun</option>
      </select>
    </label>

    <label class="field">
      <span class="field__label">{t('pages.settings.config.language')}</span>
      <select class="input" on:change={onLocaleChange} bind:value={locale}>
        <option value="en">English</option>
        <option value="fr">Français</option>
      </select>
    </label>
  </div>
</section>


