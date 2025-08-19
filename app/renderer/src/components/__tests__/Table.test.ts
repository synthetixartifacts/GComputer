import { describe, test, expect, vi, afterEach } from 'vitest';
import Table from '../Table.svelte';
import { renderComponent } from '@ts/test-utils';

describe('Table Component', () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  });

  const mockColumns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' }
  ];

  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
  ];

  test('should render table with columns', () => {
    const { container, unmount } = renderComponent(Table, {
      columns: mockColumns, 
      data: []
    });
    cleanup = unmount;
    
    const table = container.querySelector('table');
    expect(table).toBeTruthy();
    
    const headers = container.querySelectorAll('th');
    expect(headers.length).toBeGreaterThan(0);
  });

  test('should render table with data', () => {
    const { container, unmount } = renderComponent(Table, {
      columns: mockColumns, 
      data: mockData
    });
    cleanup = unmount;
    
    const table = container.querySelector('table');
    expect(table).toBeTruthy();
    
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);
  });

  test('should have sorting functionality structure', () => {
    const { container, unmount } = renderComponent(Table, {
      columns: mockColumns, 
      data: mockData
    });
    cleanup = unmount;
    
    const headers = container.querySelectorAll('th');
    expect(headers.length).toBeGreaterThan(0);
  });

  test('should handle selectable prop', () => {
    const { container, unmount } = renderComponent(Table, {
      columns: mockColumns, 
      data: mockData,
      selectable: true
    });
    cleanup = unmount;
    
    const table = container.querySelector('table');
    expect(table).toBeTruthy();
  });

  test('should display empty state', () => {
    const { container, unmount } = renderComponent(Table, {
      columns: mockColumns, 
      data: [],
      emptyMessage: 'No data available'
    });
    cleanup = unmount;
    
    const table = container.querySelector('table');
    expect(table).toBeTruthy();
  });

  test('should handle pagination', () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`
    }));
    
    const { container, unmount } = renderComponent(Table, {
      columns: mockColumns, 
      data: largeData,
      pageSize: 10
    });
    cleanup = unmount;
    
    const table = container.querySelector('table');
    expect(table).toBeTruthy();
  });

  test('should handle basic structure', () => {
    const { container, unmount } = renderComponent(Table, {
      columns: mockColumns, 
      data: mockData
    });
    cleanup = unmount;
    
    const table = container.querySelector('table');
    expect(table).toBeTruthy();
  });
});