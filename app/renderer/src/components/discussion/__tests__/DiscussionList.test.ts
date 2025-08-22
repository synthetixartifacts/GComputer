import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import DiscussionList from '../DiscussionList.svelte';
import type { Discussion } from '@features/discussion/types';

// Mock the router service
vi.mock('@features/router/service', () => ({
  goto: vi.fn(),
}));

// Mock the i18n store
vi.mock('@ts/i18n', () => ({
  t: writable((key: string) => key),
}));

describe('DiscussionList', () => {
  const mockDiscussions: Discussion[] = [
    {
      id: 1,
      title: 'First Discussion',
      isFavorite: true,
      agentId: 1,
      agent: {
        id: 1,
        name: 'Assistant',
        code: 'assistant',
        description: 'General assistant',
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: 2,
      title: 'Second Discussion',
      isFavorite: false,
      agentId: 2,
      agent: {
        id: 2,
        name: 'Researcher',
        code: 'researcher',
        description: 'Research assistant',
      },
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-04'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render discussions list', () => {
    const { container } = render(DiscussionList, {
      props: {
        discussions: mockDiscussions,
      },
    });

    expect(container.querySelector('.discussion-list')).toBeTruthy();
    expect(container.querySelector('.list-header')).toBeTruthy();
    expect(container.querySelector('.list-content')).toBeTruthy();
  });

  it('should show search input', () => {
    const { container } = render(DiscussionList, {
      props: {
        discussions: mockDiscussions,
      },
    });

    const searchInput = container.querySelector('.search-input') as HTMLInputElement;
    expect(searchInput).toBeTruthy();
    expect(searchInput.placeholder).toBe('discussion.list.search');
  });

  it('should filter discussions based on search query', async () => {
    const { container } = render(DiscussionList, {
      props: {
        discussions: mockDiscussions,
      },
    });

    const searchInput = container.querySelector('.search-input') as HTMLInputElement;
    
    // Type in search
    await fireEvent.input(searchInput, { target: { value: 'First' } });
    
    // Should filter the list
    await waitFor(() => {
      const tableRows = container.querySelectorAll('tbody tr');
      expect(tableRows.length).toBeLessThan(mockDiscussions.length);
    });
  });

  it('should call onSelect when discussion is clicked', async () => {
    const onSelect = vi.fn();
    const { container } = render(DiscussionList, {
      props: {
        discussions: mockDiscussions,
        onSelect,
      },
    });

    // Find and click continue button
    const continueButton = container.querySelector('.action-continue[data-id="1"]') as HTMLElement;
    await fireEvent.click(continueButton);

    expect(onSelect).toHaveBeenCalledWith(mockDiscussions[0]);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn();
    const { container } = render(DiscussionList, {
      props: {
        discussions: mockDiscussions,
        onDelete,
      },
    });

    // Find and click delete button
    const deleteButton = container.querySelector('.action-delete[data-id="1"]') as HTMLElement;
    await fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(mockDiscussions[0]);
  });

  it('should call onToggleFavorite when favorite toggle is clicked', async () => {
    const onToggleFavorite = vi.fn();
    const { container } = render(DiscussionList, {
      props: {
        discussions: mockDiscussions,
        onToggleFavorite,
      },
    });

    // Find and click favorite toggle
    const favoriteToggle = container.querySelector('.favorite-toggle[data-id="1"]') as HTMLElement;
    await fireEvent.click(favoriteToggle);

    expect(onToggleFavorite).toHaveBeenCalledWith(mockDiscussions[0]);
  });

  it('should navigate to new discussion when button is clicked', async () => {
    const { goto } = await import('@features/router/service');
    const { container } = render(DiscussionList, {
      props: {
        discussions: mockDiscussions,
      },
    });

    const newButton = container.querySelector('.btn-primary') as HTMLElement;
    await fireEvent.click(newButton);

    expect(goto).toHaveBeenCalledWith('discussion.new');
  });

  it('should display favorite icon correctly', () => {
    const { container } = render(DiscussionList, {
      props: {
        discussions: mockDiscussions,
      },
    });

    const firstFavorite = container.querySelector('.favorite-toggle[data-id="1"]');
    const secondFavorite = container.querySelector('.favorite-toggle[data-id="2"]');

    expect(firstFavorite?.textContent).toBe('⭐'); // Favorited
    expect(secondFavorite?.textContent).toBe('☆'); // Not favorited
  });

  it('should filter by agent name in search', async () => {
    const { container } = render(DiscussionList, {
      props: {
        discussions: mockDiscussions,
      },
    });

    const searchInput = container.querySelector('.search-input') as HTMLInputElement;
    
    // Search by agent name
    await fireEvent.input(searchInput, { target: { value: 'Researcher' } });
    
    await waitFor(() => {
      const tableRows = container.querySelectorAll('tbody tr');
      expect(tableRows.length).toBeLessThan(mockDiscussions.length);
    });
  });
});