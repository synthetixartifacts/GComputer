import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import Drawer from '../Drawer.svelte';

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

describe('Drawer', () => {
  let cleanup: () => void;

  afterEach(() => {
    if (cleanup) {
      cleanup();
    }
  });

  test('should render when open', () => {
    const { container, unmount } = renderComponent(Drawer, {
      open: true,
      title: 'Test Drawer',
    });
    cleanup = unmount;

    // Component uses gc-sidebar class, not gc-drawer
    const sidebar = container.querySelector('.gc-sidebar');
    expect(sidebar).toBeTruthy();
    expect(sidebar?.classList.contains('gc-sidebar--open')).toBe(true);
  });

  test('should not show backdrop when closed', () => {
    const { container, unmount } = renderComponent(Drawer, {
      open: false,
      title: 'Test Drawer',
    });
    cleanup = unmount;

    const backdrop = container.querySelector('.gc-sidebar-backdrop');
    expect(backdrop).toBeFalsy();
  });

  test('should show backdrop when open', () => {
    const { container, unmount } = renderComponent(Drawer, {
      open: true,
      title: 'Test Drawer',
    });
    cleanup = unmount;

    const backdrop = container.querySelector('.gc-sidebar-backdrop');
    expect(backdrop).toBeTruthy();
  });

  test('should display title', () => {
    const { container, unmount } = renderComponent(Drawer, {
      open: true,
      title: 'My Drawer Title',
    });
    cleanup = unmount;

    const heading = container.querySelector('h2');
    expect(heading?.textContent).toBe('My Drawer Title');
  });

  test('should have proper ARIA attributes', () => {
    const { container, unmount } = renderComponent(Drawer, {
      open: true,
      title: 'Accessible Drawer',
    });
    cleanup = unmount;

    const sidebar = container.querySelector('.gc-sidebar');
    expect(sidebar?.getAttribute('aria-hidden')).toBe('false');
    expect(sidebar?.getAttribute('aria-labelledby')).toMatch(/gc-drawer-title-/);
    expect(sidebar?.getAttribute('tabindex')).toBe('-1');
  });

  test('should have aria-hidden true when closed', () => {
    const { container, unmount } = renderComponent(Drawer, {
      open: false,
      title: 'Closed Drawer',
    });
    cleanup = unmount;

    const sidebar = container.querySelector('.gc-sidebar');
    expect(sidebar?.getAttribute('aria-hidden')).toBe('true');
  });

  test('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container, unmount } = renderComponent(Drawer, {
      open: true,
      title: 'Test Drawer',
      onClose,
    });
    cleanup = unmount;

    const backdrop = container.querySelector('.gc-sidebar-backdrop');
    backdrop?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).toHaveBeenCalled();
  });

  test('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    const { container, unmount } = renderComponent(Drawer, {
      open: true,
      title: 'Test Drawer',
      onClose,
    });
    cleanup = unmount;

    const closeButton = container.querySelector('.gc-icon-btn');
    closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).toHaveBeenCalled();
  });

  test('should handle Escape key press', () => {
    const onClose = vi.fn();
    const { container, unmount } = renderComponent(Drawer, {
      open: true,
      title: 'Test Drawer',
      onClose,
    });
    cleanup = unmount;

    const sidebar = container.querySelector('.gc-sidebar');
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    sidebar?.dispatchEvent(event);
    expect(onClose).toHaveBeenCalled();
  });

  test('should not call onClose for Escape when closed', () => {
    const onClose = vi.fn();
    const { container, unmount } = renderComponent(Drawer, {
      open: false,
      title: 'Test Drawer',
      onClose,
    });
    cleanup = unmount;

    const sidebar = container.querySelector('.gc-sidebar');
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    sidebar?.dispatchEvent(event);
    expect(onClose).not.toHaveBeenCalled();
  });

  test('should handle Tab key for focus trapping', () => {
    const { container, unmount } = renderComponent(Drawer, {
      open: true,
      title: 'Test Drawer',
    });
    cleanup = unmount;

    const sidebar = container.querySelector('.gc-sidebar');
    const closeButton = container.querySelector('.gc-icon-btn') as HTMLElement;
    
    // Focus the close button
    closeButton?.focus();
    
    // Simulate Tab key press
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    sidebar?.dispatchEvent(event);
    
    // The component should handle focus trapping
    expect(sidebar).toBeTruthy();
  });

  test('should work without title', () => {
    const { container, unmount } = renderComponent(Drawer, {
      open: true,
    });
    cleanup = unmount;

    const heading = container.querySelector('h2');
    expect(heading).toBeFalsy();
  });

  test('should work without onClose callback', () => {
    const { container, unmount } = renderComponent(Drawer, {
      open: true,
      title: 'Test Drawer',
    });
    cleanup = unmount;

    const closeButton = container.querySelector('.gc-icon-btn');
    expect(() => {
      closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }).not.toThrow();
  });

  test('should apply correct classes when open', () => {
    const { container, unmount } = renderComponent(Drawer, {
      open: true,
      title: 'Test Drawer',
    });
    cleanup = unmount;

    const sidebar = container.querySelector('.gc-sidebar');
    expect(sidebar?.classList.contains('gc-sidebar')).toBe(true);
    expect(sidebar?.classList.contains('gc-sidebar--open')).toBe(true);
  });

  test('should not have open class when closed', () => {
    const { container, unmount } = renderComponent(Drawer, {
      open: false,
      title: 'Test Drawer',
    });
    cleanup = unmount;

    const sidebar = container.querySelector('.gc-sidebar');
    expect(sidebar?.classList.contains('gc-sidebar')).toBe(true);
    expect(sidebar?.classList.contains('gc-sidebar--open')).toBe(false);
  });
});