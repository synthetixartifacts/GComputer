import { sidebarOpen, modalOpen, setThemeDom } from './store';
import { themeModeStore } from '@features/settings/store';

export function initTheme(): () => void {
  const unsubscribe = themeModeStore.subscribe((mode) => setThemeDom(mode));
  return unsubscribe;
}

export function openSidebar(): void { sidebarOpen.set(true); }
export function closeSidebar(): void { sidebarOpen.set(false); }
export function toggleSidebar(): void { sidebarOpen.update((v) => !v); }

export function openModal(): void { modalOpen.set(true); }
export function closeModal(): void { modalOpen.set(false); }


