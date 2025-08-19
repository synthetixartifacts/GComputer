import { describe, test, expect, afterEach } from 'vitest';
import { tick } from 'svelte';
import ProgressBar from '../ProgressBar.svelte';
import { renderComponent } from '@ts/test-utils';

describe('ProgressBar Component', () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  });

  test('should render with default props', () => {
    const { container, unmount } = renderComponent(ProgressBar);
    cleanup = unmount;
    
    const progressBar = container.querySelector('.gc-progress');
    expect(progressBar).toBeTruthy();
  });

  test('should display correct progress percentage', async () => {
    const { container, unmount } = renderComponent(ProgressBar, { value: 50 });
    cleanup = unmount;
    
    await tick();
    const fill = container.querySelector('.gc-progress__bar');
    expect(fill?.getAttribute('style')).toContain('width: 50%');
  });

  test('should clamp progress between 0 and 100', async () => {
    const { container, rerender, unmount } = renderComponent(ProgressBar, { value: 150 });
    cleanup = unmount;
    
    await tick();
    let fill = container.querySelector('.gc-progress__bar');
    expect(fill?.getAttribute('style')).toContain('width: 100%');
    
    rerender({ value: -50 });
    await tick();
    fill = container.querySelector('.gc-progress__bar');
    expect(fill?.getAttribute('style')).toContain('width: 0%');
  });

  test('should display label when showValue is true', () => {
    const { container, unmount } = renderComponent(ProgressBar, { 
      value: 75,
      showValue: true 
    });
    cleanup = unmount;
    
    const label = container.querySelector('.gc-progress__label');
    expect(label).toBeTruthy();
    expect(label?.textContent).toContain('75%');
  });

  test('should apply size variant class', () => {
    const { container, unmount } = renderComponent(ProgressBar, { 
      value: 50,
      size: 'lg'
    });
    cleanup = unmount;
    
    const progressBar = container.querySelector('.gc-progress');
    expect(progressBar?.className).toContain('gc-progress--lg');
  });

  test('should apply color variant class', () => {
    const { container, unmount } = renderComponent(ProgressBar, { 
      value: 50,
      color: 'success'
    });
    cleanup = unmount;
    
    const progressBar = container.querySelector('.gc-progress');
    expect(progressBar?.className).toContain('gc-progress--success');
  });

  test('should handle indeterminate state', () => {
    const { container, unmount } = renderComponent(ProgressBar, { 
      indeterminate: true
    });
    cleanup = unmount;
    
    const progressBar = container.querySelector('.gc-progress');
    expect(progressBar?.className).toContain('gc-progress--indeterminate');
  });

  test('should display percentage label', () => {
    const { container, unmount } = renderComponent(ProgressBar, { 
      value: 30,
      showValue: true
    });
    cleanup = unmount;
    
    const label = container.querySelector('.gc-progress__label');
    expect(label?.textContent).toContain('30%');
  });

  test('should have proper accessibility attributes', () => {
    const { container, unmount } = renderComponent(ProgressBar, { 
      value: 60,
      ariaLabel: 'Upload progress'
    });
    cleanup = unmount;
    
    const progressBar = container.querySelector('.gc-progress');
    expect(progressBar?.getAttribute('role')).toBe('progressbar');
    expect(progressBar?.getAttribute('aria-valuenow')).toBe('60');
    expect(progressBar?.getAttribute('aria-valuemin')).toBe('0');
    expect(progressBar?.getAttribute('aria-valuemax')).toBe('100');
  });

  test('should support custom max value', async () => {
    const { container, unmount } = renderComponent(ProgressBar, { 
      value: 150,
      max: 300
    });
    cleanup = unmount;
    
    await tick();
    const fill = container.querySelector('.gc-progress__bar');
    expect(fill?.getAttribute('style')).toContain('width: 50%');
    
    const progressBar = container.querySelector('.gc-progress');
    expect(progressBar?.getAttribute('aria-valuemax')).toBe('300');
  });
});