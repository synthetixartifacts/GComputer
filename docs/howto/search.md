# Search components

## Overview
`SearchBox` is an accessible combobox for query input and suggestions. `SearchResults` renders result lists with highlighting.

## SearchBox
```svelte
<script lang="ts">
  import SearchBox from '@components/search/SearchBox.svelte';
  import type { Suggestion } from '@features/search/types';
  let value = '';
  let suggestions: Suggestion[] = [];
</script>

<SearchBox
  {value}
  placeholder="Search..."
  suggestions={suggestions}
  labels={{ clear: 'Clear', suggestions: 'Suggestions' }}
  activeIndex={null}
  on:input={(e) => (value = e.detail)}
  on:submit={(e) => {/* run search */}}
  on:selectSuggestion={(e) => {/* pick suggestion */}}
/>
```

## SearchResults
```svelte
<script lang="ts">
  import SearchResults from '@components/search/SearchResults.svelte';
  import type { SearchItem } from '@features/search/types';
  let results: SearchItem[] = [];
  let loading = false;
</script>

<SearchResults
  {results}
  {loading}
  highlightQuery="apple"
  emptyLabel="No results"
  countLabel={(n) => `${n} results`}
/>
```


