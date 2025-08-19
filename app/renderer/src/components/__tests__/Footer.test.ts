import { describe, test, expect, afterEach } from 'vitest';
import Footer from '../Footer.svelte';
import { renderComponent } from '@ts/test-utils';

describe('Footer Component', () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  });

  test('should render footer element', () => {
    const { container, unmount } = renderComponent(Footer);
    cleanup = unmount;
    
    const footer = container.querySelector('footer');
    expect(footer).toBeTruthy();
  });

  test('should have correct CSS classes', () => {
    const { container, unmount } = renderComponent(Footer);
    cleanup = unmount;
    
    const footer = container.querySelector('footer');
    expect(footer?.className).toBeTruthy();
  });

  test('should maintain proper structure', () => {
    const { container, unmount } = renderComponent(Footer);
    cleanup = unmount;
    
    expect(container.firstElementChild).toBeTruthy();
    expect(container.firstElementChild?.tagName.toLowerCase()).toBe('footer');
  });

  test('should render content', () => {
    const { container, unmount } = renderComponent(Footer);
    cleanup = unmount;
    
    const footer = container.querySelector('footer');
    expect(footer?.innerHTML).toBeTruthy();
  });
});