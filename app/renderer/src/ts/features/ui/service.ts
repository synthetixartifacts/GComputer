import { sidebarOpen, modalOpen, setThemeDom } from './store';
import { themeModeStore } from '@features/settings/store';

export function initTheme(): () => void {
  // Apply immediately based on current store value, then subscribe for changes
  let initialApplied = false;
  const unsubscribe = themeModeStore.subscribe((mode) => {
    setThemeDom(mode);
    initialApplied = true;
  });
  if (!initialApplied) {
    // Defensive: apply default if subscription is async
    setThemeDom('light');
  }
  return unsubscribe;
}

export function openSidebar(): void { sidebarOpen.set(true); }
export function closeSidebar(): void { sidebarOpen.set(false); }
export function toggleSidebar(): void { sidebarOpen.update((v) => !v); }

export function openModal(): void { modalOpen.set(true); }
export function closeModal(): void { modalOpen.set(false); }

import { discussionSidebarOpen } from './store';

export function openDiscussionSidebar(): void { discussionSidebarOpen.set(true); }
export function closeDiscussionSidebar(): void { discussionSidebarOpen.set(false); }
export function toggleDiscussionSidebar(): void { discussionSidebarOpen.update((v) => !v); }


