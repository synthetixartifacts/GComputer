import { derived, writable } from 'svelte/store';
import type { MenuItem } from './types';
import type { Route } from '@features/router/types';

export const menuItems = writable<MenuItem[]>([
  { label: 'Home', route: 'home' },
  {
    label: 'Category',
    defaultOpen: true,
    children: [
      { label: 'Item 1', route: 'category.item1' },
      { label: 'Item 2', route: 'category.item2' },
    ],
  },
  {
    label: 'Settings',
    defaultOpen: true,
    children: [
      { label: 'Config', route: 'settings.config' },
      { label: 'About', route: 'settings.about' },
    ],
  },
  {
    label: 'Test',
    defaultOpen: true,
    children: [
      { label: 'Styleguide', route: 'test.styleguide' },
      { label: 'Test 1', route: 'test.test1' },
    ],
  },
]);

export const expandedKeys = writable<Record<string, boolean>>({});

export const activeRoute = writable<Route>('home');

export const effectiveExpanded = derived([
  menuItems,
  expandedKeys,
  activeRoute,
], ([menuItemsValue, expandedValue, active]) => {
  function applyDefaults(items: MenuItem[], acc: Record<string, boolean>): Record<string, boolean> {
    for (const item of items) {
      if (item.children && item.children.length > 0) {
        if (item.defaultOpen) acc[item.label] = true;
        applyDefaults(item.children, acc);
      }
    }
    return acc;
  }

  function expandAncestorsForActive(items: MenuItem[], acc: Record<string, boolean>): boolean {
    let contains = false;
    for (const item of items) {
      let subtreeContains = false;
      if (item.children && item.children.length > 0) {
        subtreeContains = expandAncestorsForActive(item.children, acc);
        if (subtreeContains) {
          acc[item.label] = true;
        }
      }
      const isSelf = !!item.route && item.route === active;
      contains = contains || isSelf || subtreeContains;
    }
    return contains;
  }

  const withDefaults = applyDefaults(menuItemsValue, { ...expandedValue });
  expandAncestorsForActive(menuItemsValue, withDefaults);
  return withDefaults;
});


