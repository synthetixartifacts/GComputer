<script lang="ts">
  import { onDestroy } from 'svelte';
  import { setLocale as setLocaleSetting, setThemeMode as setThemeSetting } from '@features/settings/service';
  import { settingsStore } from '@features/settings/store';
  import type { ThemeMode, Locale } from '@features/settings/types';
  import { t as tStore } from '@ts/i18n/store';

  let theme: ThemeMode = 'light';
  let locale: Locale = 'en';
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
    await setThemeSetting(value);
  }

  async function onLocaleChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value as Locale;
    await setLocaleSetting(value);
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


