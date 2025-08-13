import { writable } from 'svelte/store';
import type { ThemeMode } from '@features/settings/types';

export const sidebarOpen = writable<boolean>(false);
export const modalOpen = writable<boolean>(false);

export function setThemeDom(mode: ThemeMode): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', mode);
  root.classList.toggle('dark', mode === 'dark');
}


