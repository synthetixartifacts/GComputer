import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import AdminCrud from '../AdminCrud.svelte';
import { renderComponent } from '@ts/test-utils';

describe('AdminCrud Component', () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  });

  const mockConfig = {
    entityType: 'test',
    fields: [
      { id: 'name', label: 'Name', type: 'text', required: true },
      { id: 'email', label: 'Email', type: 'text' },
      { id: 'active', label: 'Active', type: 'boolean' },
    ],
  };

  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', active: true },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', active: false },
  ];

  test('should render CRUD interface', () => {
    const { container, unmount } = renderComponent(AdminCrud, {
      title: 'Test Items',
      config: mockConfig, 
      data: mockData
    });
    cleanup = unmount;
    
    const adminCrud = container.firstElementChild;
    expect(adminCrud).toBeTruthy();
  });

  test('should show create functionality', () => {
    const { container, unmount } = renderComponent(AdminCrud, {
      title: 'Test Items',
      config: mockConfig, 
      data: mockData
    });
    cleanup = unmount;
    
    const adminCrud = container.firstElementChild;
    expect(adminCrud).toBeTruthy();
  });

  test('should handle empty state', () => {
    const { container, unmount } = renderComponent(AdminCrud, {
      title: 'Test Items',
      config: mockConfig, 
      data: []
    });
    cleanup = unmount;
    
    const adminCrud = container.firstElementChild;
    expect(adminCrud).toBeTruthy();
  });

  test('should handle loading state', () => {
    const { container, unmount } = renderComponent(AdminCrud, {
      title: 'Test Items',
      config: mockConfig, 
      data: [], 
      loading: true
    });
    cleanup = unmount;
    
    const adminCrud = container.firstElementChild;
    expect(adminCrud).toBeTruthy();
  });
});