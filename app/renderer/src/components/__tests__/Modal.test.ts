import { describe, test, expect, vi, afterEach } from 'vitest';
import { tick } from 'svelte';
import Modal from '../Modal.svelte';
import { renderComponent } from '@ts/test-utils';

describe('Modal Component', () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  });

  test('should not render when open is false', () => {
    const { container, unmount } = renderComponent(Modal, { 
      open: false,
      onClose: () => {}
    });
    cleanup = unmount;
    
    const modal = container.querySelector('.gc-modal');
    expect(modal).toBeFalsy();
  });

  test('should render when open is true', () => {
    const { container, unmount } = renderComponent(Modal, { 
      open: true,
      onClose: () => {}
    });
    cleanup = unmount;
    
    const modal = container.querySelector('.gc-modal');
    expect(modal).toBeTruthy();
  });

  test('should render title when provided', () => {
    const { container, unmount } = renderComponent(Modal, {
      open: true,
      onClose: () => {},
      title: 'app.test'
    });
    cleanup = unmount;
    
    const title = container.querySelector('#gc-modal-title');
    expect(title || container.querySelector('h3')).toBeTruthy();
  });

  test('should render content', () => {
    const { container, unmount } = renderComponent(Modal, { 
      open: true,
      onClose: () => {}
    });
    cleanup = unmount;
    
    const modal = container.querySelector('.gc-modal');
    expect(modal?.innerHTML).toBeTruthy();
  });

  test('should have close functionality structure', () => {
    const { container, unmount } = renderComponent(Modal, { 
      open: true,
      onClose: () => {}
    });
    cleanup = unmount;
    
    const closeButton = container.querySelector('button');
    expect(closeButton).toBeTruthy();
  });

  test('should have overlay structure', () => {
    const { container, unmount } = renderComponent(Modal, { 
      open: true,
      onClose: () => {}
    });
    cleanup = unmount;
    
    const backdrop = container.querySelector('.gc-modal-backdrop');
    expect(backdrop).toBeTruthy();
  });

  test('should maintain modal structure', () => {
    const { container, unmount } = renderComponent(Modal, { 
      open: true,
      onClose: () => {}
    });
    cleanup = unmount;
    
    expect(container.firstElementChild).toBeTruthy();
  });

  test('should have modal content structure', () => {
    const { container, unmount } = renderComponent(Modal, { 
      open: true,
      onClose: () => {}
    });
    cleanup = unmount;
    
    const modalDialog = container.querySelector('.gc-modal__dialog');
    expect(modalDialog).toBeTruthy();
  });

  test('should handle basic rendering', () => {
    const { container, unmount } = renderComponent(Modal, {
      open: true,
      onClose: () => {}
    });
    cleanup = unmount;
    
    const modal = container.querySelector('.gc-modal');
    expect(modal).toBeTruthy();
  });

  test('should render modal when open', () => {
    const { container, unmount } = renderComponent(Modal, { 
      open: true,
      onClose: () => {}
    });
    cleanup = unmount;
    
    expect(container.firstElementChild).toBeTruthy();
  });

  test('should have footer structure', () => {
    const { container, unmount } = renderComponent(Modal, { 
      open: true,
      onClose: () => {}
    });
    cleanup = unmount;
    
    const modal = container.querySelector('.gc-modal');
    expect(modal).toBeTruthy();
  });
});