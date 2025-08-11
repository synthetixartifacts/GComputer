import { derived, writable } from 'svelte/store';
import type { MenuItem } from './types';
import type { Route } from '@features/router/types';

export const menuItems = writable<MenuItem[]>([
  { label: 'app.menu.home', i18nKey: 'app.menu.home', route: 'home' },
  {
    label: 'app.menu.category',
    i18nKey: 'app.menu.category',
    children: [
      { label: 'app.menu.item1', i18nKey: 'app.menu.item1', route: 'category.item1' },
      { label: 'app.menu.item2', i18nKey: 'app.menu.item2', route: 'category.item2' },
    ],
  },
  {
    label: 'app.menu.settings',
    i18nKey: 'app.menu.settings',
    children: [
      { label: 'app.menu.config', i18nKey: 'app.menu.config', route: 'settings.config' },
      { label: 'app.menu.about', i18nKey: 'app.menu.about', route: 'settings.about' },
    ],
  },
  {
    label: 'app.menu.test',
    i18nKey: 'app.menu.test',
    children: [
      { label: 'app.menu.styleguide', i18nKey: 'app.menu.styleguide', route: 'test.styleguide' },
      { label: 'app.menu.test1', i18nKey: 'app.menu.test1', route: 'test.test1' },
      {
        label: 'app.menu.db',
        i18nKey: 'app.menu.db',
        children: [
          { label: 'app.menu.db.testTable', i18nKey: 'app.menu.db.testTable', route: 'test.db.test-table' },
        ],
      },
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


