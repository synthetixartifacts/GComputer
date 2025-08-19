import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { writable } from 'svelte/store';
import Sidebar from '../Sidebar.svelte';

// Mock the stores
vi.mock('@features/navigation/store', () => ({
  menuItems: writable([
    { id: 'home', label: 'Home', path: '/', icon: 'home' },
    { id: 'about', label: 'About', path: '/about', icon: 'info' },
  ]),
  activeRoute: writable('/'),
  effectiveExpanded: writable({}) // Add missing effectiveExpanded mock
}));

vi.mock('@ts/i18n/store', () => ({
  t: writable((key: string) => key)
}));

function renderComponent(Component: any, props: any = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  
  const instance = new Component({
    target: container,
    props,
  });

  return {
    container,
    instance,
    unmount: () => {
      instance.$destroy();
      document.body.removeChild(container);
    },
  };
}

describe('Sidebar', () => {
  let cleanup: () => void;

  afterEach(() => {
    if (cleanup) {
      cleanup();
    }
  });

  test('should render with navigation', () => {
    const { container, unmount } = renderComponent(Sidebar, {
      open: true,
      onClose: vi.fn(),
    });
    cleanup = unmount;

    const nav = container.querySelector('nav');
    expect(nav).toBeTruthy();
    expect(nav?.classList.contains('grid')).toBe(true);
    expect(nav?.classList.contains('gap-2')).toBe(true);
  });

  test('should pass open prop to Drawer', () => {
    const { container, unmount } = renderComponent(Sidebar, {
      open: true,
      onClose: vi.fn(),
    });
    cleanup = unmount;

    const sidebar = container.querySelector('.gc-sidebar--open');
    expect(sidebar).toBeTruthy();
  });

  test('should render closed state', () => {
    const { container, unmount } = renderComponent(Sidebar, {
      open: false,
      onClose: vi.fn(),
    });
    cleanup = unmount;

    const sidebar = container.querySelector('.gc-sidebar');
    expect(sidebar?.classList.contains('gc-sidebar--open')).toBe(false);
  });

  test('should call onClose when drawer closes', () => {
    const onClose = vi.fn();
    const { container, unmount } = renderComponent(Sidebar, {
      open: true,
      onClose,
    });
    cleanup = unmount;

    const closeButton = container.querySelector('.gc-icon-btn');
    closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).toHaveBeenCalled();
  });

  test('should render with title from translation', () => {
    const { container, unmount } = renderComponent(Sidebar, {
      open: true,
      onClose: vi.fn(),
    });
    cleanup = unmount;

    const heading = container.querySelector('h2');
    expect(heading?.textContent).toBe('app.menu.menu');
  });
});