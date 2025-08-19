import { describe, test, expect, afterEach } from 'vitest';
import Header from '../Header.svelte';
import { renderComponent } from '@ts/test-utils';

describe('Header Component', () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  });

  test('should render header element', () => {
    const { container, unmount } = renderComponent(Header);
    cleanup = unmount;
    
    const header = container.querySelector('header');
    expect(header).toBeTruthy();
  });

  test('should have correct CSS classes', () => {
    const { container, unmount } = renderComponent(Header);
    cleanup = unmount;
    
    const header = container.querySelector('header');
    expect(header?.className).toBeTruthy();
  });

  test('should render content', () => {
    const { container, unmount } = renderComponent(Header);
    cleanup = unmount;
    
    const header = container.querySelector('header');
    expect(header?.innerHTML).toBeTruthy();
  });

  test('should maintain semantic HTML structure', () => {
    const { container, unmount } = renderComponent(Header);
    cleanup = unmount;
    
    const header = container.querySelector('header');
    expect(header).toBeTruthy();
    expect(header?.tagName).toBe('HEADER');
  });
});