import { get } from 'svelte/store';
import { expandedKeys, effectiveExpanded } from './store';

export function toggleExpanded(label: string): void {
  const isOpen = !!(get(effectiveExpanded) as Record<string, boolean>)[label];
  expandedKeys.update((v) => ({ ...v, [label]: !isOpen }));
}

export function isLabelExpanded(label: string): boolean {
  return !!(get(effectiveExpanded) as Record<string, boolean>)[label];
}


