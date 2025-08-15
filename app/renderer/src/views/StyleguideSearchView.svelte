<script lang="ts">
  import { onDestroy } from 'svelte';
  import { t as tStore } from '@ts/i18n/store';
  import SearchBox from '@components/search/SearchBox.svelte';
  import SearchResults from '@components/search/SearchResults.svelte';
  import { searchState, initializeSearch, setQuery, submitSearch, moveSelection, pickSelectedSuggestion } from '@features/search/store';

  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  onDestroy(() => unsubT());

  initializeSearch();

  let query = '';
  let loading = false;
  let suggestions = [] as { id: string; label: string }[];
  let results = [] as any[];
  let activeIndex: number | null = null;
  const unsubState = searchState.subscribe((s) => {
    query = s.query;
    loading = s.loading;
    suggestions = s.suggestions;
    results = s.results;
    activeIndex = s.selectedIndex;
  });
  onDestroy(() => unsubState());

  function handleInput(v: string) {
    setQuery(v);
  }
  function handleSubmit(v: string) {
    submitSearch(v);
  }
  function handleArrowDown() {
    moveSelection(1);
  }
  function handleArrowUp() {
    moveSelection(-1);
  }
  function handleSelectSuggestion(sug: { id: string; label: string }) {
    setQuery(sug.label);
    submitSearch(sug.label);
  }
  function handleClear() {
    setQuery('');
  }
</script>

<section class="container-page stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.styleguide.search.title')}</h2>
  <p class="text-sm opacity-80">{t('pages.styleguide.search.desc')}</p>

  <div class="prose prose-sm dark:prose-invert">
    <h3>HOWTO</h3>
    <p>{t('pages.styleguide.search.howto')}</p>
    <ul>
      <li>ap → suggestions only</li>
      <li>apple → multiple results</li>
      <li>john → single result</li>
      <li>zzzz → empty state</li>
    </ul>
  </div>

  <div class="grid gap-3">
    <SearchBox
      value={query}
      placeholder={t('pages.styleguide.search.box.placeholder')}
      suggestions={suggestions}
      labels={{ clear: t('pages.styleguide.search.box.clear'), suggestions: t('pages.styleguide.search.box.suggestions') }}
      activeIndex={activeIndex}
      on:input={(e) => handleInput(e.detail)}
      on:submit={(e) => handleSubmit(e.detail)}
      on:selectSuggestion={(e) => handleSelectSuggestion(e.detail)}
      on:clear={handleClear}
      on:arrowDown={handleArrowDown}
      on:arrowUp={handleArrowUp}
    />

    <SearchResults
      results={results}
      loading={loading}
      highlightQuery={query}
      emptyLabel={t('pages.styleguide.search.results.none')}
      countLabel={(n: number) => t('pages.styleguide.search.results.count', { count: n })}
    />
  </div>
</section>


