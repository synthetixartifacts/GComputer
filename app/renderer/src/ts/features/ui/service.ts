import { themeMode, sidebarOpen, modalOpen, type ThemeMode, setThemeDom } from './store';

export function initTheme(): void {
  themeMode.subscribe((mode) => setThemeDom(mode));
}

export function toggleTheme(): void {
  themeMode.update((m) => (m === 'light' ? 'dark' : 'light'));
}

export function openSidebar(): void { sidebarOpen.set(true); }
export function closeSidebar(): void { sidebarOpen.set(false); }
export function toggleSidebar(): void { sidebarOpen.update((v) => !v); }

export function openModal(): void { modalOpen.set(true); }
export function closeModal(): void { modalOpen.set(false); }


