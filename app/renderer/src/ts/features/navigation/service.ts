import { get } from 'svelte/store';
import { expandedKeys, effectiveExpanded } from './store';

export function toggleExpanded(label: string): void {
  expandedKeys.update((v) => ({ ...v, [label]: !v[label] }));
}

export function isLabelExpanded(label: string): boolean {
  return !!(get(effectiveExpanded) as Record<string, boolean>)[label];
}


