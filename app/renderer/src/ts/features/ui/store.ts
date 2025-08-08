import { writable } from 'svelte/store';

export type ThemeMode = 'light' | 'dark';

export const themeMode = writable<ThemeMode>('light');
export const sidebarOpen = writable<boolean>(false);
export const modalOpen = writable<boolean>(false);

export function toggleTheme(): void {
  themeMode.update((m) => (m === 'light' ? 'dark' : 'light'));
}

export function setThemeDom(mode: ThemeMode): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', mode === 'dark' ? 'dark' : 'light');
}


