<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { Suggestion } from '@features/search/types';

  export let value: string = '';
  export let placeholder: string = '';
  export let minChars: number = 1;
  export let maxSuggestions: number = 6;
  export let suggestions: Suggestion[] = [];
  export let getSuggestionLabel: (s: Suggestion) => string = (s) => s.label;
  export let autoFocus: boolean = false;
  export let showClear: boolean = true;
  export let labels: { clear?: string; suggestions?: string } = {};
  export let activeIndex: number | null = null;
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher<{
    input: string;
    submit: string;
    selectSuggestion: Suggestion;
    clear: void;
    arrowUp: void;
    arrowDown: void;
    focus: void;
    blur: void;
  }>();

  let inputEl: HTMLInputElement;
  const listboxId = 'searchbox-' + Math.random().toString(36).slice(2);
  let isFocused = false;

  $: open = !disabled && isFocused && value.trim().length >= minChars && suggestions.length > 0;
  $: activeDescId = activeIndex != null ? `${listboxId}-opt-${activeIndex}` : undefined;

  function onInput(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    dispatch('input', v);
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      dispatch('arrowDown');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      dispatch('arrowUp');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex != null && suggestions[activeIndex]) {
        dispatch('selectSuggestion', suggestions[activeIndex]);
      } else {
        dispatch('submit', value);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (value) dispatch('clear');
    }
  }

  function clickSuggestion(idx: number) {
    const sug = suggestions[idx];
    if (sug) dispatch('selectSuggestion', sug);
  }

  function clearInput() {
    dispatch('clear');
  }

  onMount(() => {
    if (autoFocus && inputEl) inputEl.focus();
  });
</script>

<div class="grid gap-2">
  <div class="relative">
    <input
      bind:this={inputEl}
      class="input w-full"
      type="text"
      {placeholder}
      {disabled}
      value={value}
      on:input={onInput}
      on:keydown={onKeydown}
      on:focus={() => { isFocused = true; dispatch('focus'); }}
      on:blur={() => { isFocused = false; dispatch('blur'); }}
      role="combobox"
      aria-expanded={open}
      aria-controls={listboxId}
      aria-activedescendant={activeDescId}
      aria-autocomplete="list"
      aria-haspopup="listbox"
    />
    {#if showClear && value}
      <button
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-sm opacity-60 hover:opacity-100"
        on:click={clearInput}
        aria-label={labels.clear || 'Clear'}
      >×</button>
    {/if}
    {#if open}
      <div
        class="absolute left-0 right-0 mt-1 border rounded-md bg-white dark:bg-neutral-900 shadow z-20"
        role="listbox"
        id={listboxId}
        aria-label={labels.suggestions || 'Suggestions'}
      >
        <ul class="max-h-60 overflow-auto">
          {#each suggestions.slice(0, maxSuggestions) as s, i}
            <li
              id={`${listboxId}-opt-${i}`}
              role="option"
              aria-selected={activeIndex === i}
              class="px-3 py-2 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 {activeIndex === i ? 'bg-neutral-100 dark:bg-neutral-800' : ''}"
              on:mousedown|preventDefault={() => clickSuggestion(i)}
            >
              {getSuggestionLabel(s)}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</div>


