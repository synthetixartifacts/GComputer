import { writable } from 'svelte/store';
import type { SearchState } from './types';
import { initDemoData, getSuggestions, runSearch } from './service';

export const searchState = writable<SearchState>({
  query: '',
  suggestions: [],
  results: [],
  loading: false,
  selectedIndex: null,
});

export function initializeSearch(): void {
  initDemoData();
}

export function setQuery(query: string): void {
  searchState.update((s) => ({ ...s, query }));
  // update suggestions immediately
  const suggestions = getSuggestions(query);
  searchState.update((s) => ({ ...s, suggestions, selectedIndex: suggestions.length > 0 ? 0 : null }));
}

export async function submitSearch(query?: string): Promise<void> {
  searchState.update((s) => ({ ...s, loading: true }));
  const q = typeof query === 'string' ? query : getCurrent().query;
  const results = runSearch(q);
  searchState.update((s) => ({ ...s, results, loading: false }));
}

export function moveSelection(delta: number): void {
  searchState.update((s) => {
    const max = s.suggestions.length;
    if (max === 0) return { ...s, selectedIndex: null };
    const curr = s.selectedIndex ?? 0;
    const next = (curr + delta + max) % max;
    return { ...s, selectedIndex: next };
  });
}

export function pickSelectedSuggestion(): string | null {
  const s = getCurrent();
  if (s.selectedIndex == null) return null;
  const sug = s.suggestions[s.selectedIndex];
  if (!sug) return null;
  setQuery(sug.label);
  return sug.label;
}

function getCurrent(): SearchState {
  let value: SearchState;
  searchState.subscribe((v) => (value = v))();
  // @ts-expect-error value is set immediately via sync subscription
  return value;
}


