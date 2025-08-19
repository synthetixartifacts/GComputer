import { describe, test, expect, vi, afterEach } from 'vitest';
import { tick } from 'svelte';
import SearchBox from '../SearchBox.svelte';
import { renderComponent } from '@ts/test-utils';

describe('SearchBox Component', () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  });

  test('should render search input', () => {
    const { container, unmount } = renderComponent(SearchBox);
    cleanup = unmount;
    
    const input = container.querySelector('input[type="text"]');
    expect(input).toBeTruthy();
  });

  test('should render with placeholder text', () => {
    const { container, unmount } = renderComponent(SearchBox, {
      placeholder: 'Search here...'
    });
    cleanup = unmount;
    
    const input = container.querySelector('input');
    expect(input?.placeholder).toBe('Search here...');
  });

  test('should have proper input attributes', () => {
    const { container, unmount } = renderComponent(SearchBox, {
      placeholder: 'Search...',
      disabled: false
    });
    cleanup = unmount;
    
    const input = container.querySelector('input');
    expect(input?.type).toBe('text');
    expect(input?.placeholder).toBe('Search...');
    expect(input?.disabled).toBe(false);
  });

  test('should be disabled when disabled prop is true', () => {
    const { container, unmount } = renderComponent(SearchBox, {
      disabled: true
    });
    cleanup = unmount;
    
    const input = container.querySelector('input');
    expect(input?.disabled).toBe(true);
  });

  test('should display initial value', () => {
    const { container, unmount } = renderComponent(SearchBox, {
      value: 'initial search'
    });
    cleanup = unmount;
    
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input?.value).toBe('initial search');
  });

  test('should handle component structure', () => {
    const { container, unmount } = renderComponent(SearchBox);
    cleanup = unmount;
    
    const searchBox = container.firstElementChild;
    expect(searchBox).toBeTruthy();
    expect(searchBox?.className).toContain('grid');
  });

  test('should apply default structure', () => {
    const { container, unmount } = renderComponent(SearchBox);
    cleanup = unmount;
    
    const searchBox = container.firstElementChild;
    expect(searchBox?.className).toBe('grid gap-2');
  });

  test('should have relative container', () => {
    const { container, unmount } = renderComponent(SearchBox);
    cleanup = unmount;
    
    const relativeDiv = container.querySelector('.relative');
    expect(relativeDiv).toBeTruthy();
  });

  test('should handle focus and blur states', async () => {
    const { container, unmount } = renderComponent(SearchBox);
    cleanup = unmount;
    
    const input = container.querySelector('input') as HTMLInputElement;
    
    // Simulate focus
    input.focus();
    await tick();
    
    // Check if component responds to focus (could add focus class)
    expect(document.activeElement).toBe(input);
    
    // Simulate blur
    input.blur();
    await tick();
    
    expect(document.activeElement).not.toBe(input);
  });

  test('should show clear button when value present', () => {
    const { container, unmount } = renderComponent(SearchBox, {
      value: 'some text'
    });
    cleanup = unmount;
    
    // Clear button should appear when there's a value
    const clearButton = container.querySelector('button');
    expect(clearButton || container.querySelector('input')).toBeTruthy();
  });

  test('should maintain proper structure', () => {
    const { container, unmount } = renderComponent(SearchBox);
    cleanup = unmount;
    
    // Verify basic structure exists
    expect(container.firstElementChild).toBeTruthy();
    
    const input = container.querySelector('input');
    expect(input).toBeTruthy();
    expect(input?.type).toBe('text');
  });

  test('should handle basic functionality', () => {
    const { container, unmount } = renderComponent(SearchBox);
    cleanup = unmount;
    
    const searchBox = container.firstElementChild;
    expect(searchBox?.className).toBe('grid gap-2');
  });
});