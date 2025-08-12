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
      {
        label: 'app.menu.styleguide.label',
        i18nKey: 'app.menu.styleguide.label',
        children: [
          { label: 'app.menu.styleguide.base', i18nKey: 'app.menu.styleguide.base', route: 'test.styleguide.base' },
          { label: 'app.menu.styleguide.inputs', i18nKey: 'app.menu.styleguide.inputs', route: 'test.styleguide.inputs' },
          { label: 'app.menu.styleguide.buttons', i18nKey: 'app.menu.styleguide.buttons', route: 'test.styleguide.buttons' },
          { label: 'app.menu.styleguide.table', i18nKey: 'app.menu.styleguide.table', route: 'test.styleguide.table' },
          { label: 'app.menu.styleguide.components', i18nKey: 'app.menu.styleguide.components', route: 'test.styleguide.components' },
          { label: 'app.menu.styleguide.media', i18nKey: 'app.menu.styleguide.media', route: 'test.styleguide.media' },
          { label: 'app.menu.styleguide.files', i18nKey: 'app.menu.styleguide.files', route: 'test.styleguide.files' },
          { label: 'app.menu.styleguide.chatbot', i18nKey: 'app.menu.styleguide.chatbot', route: 'test.styleguide.chatbot' },
        ],
      },
      {
        label: 'app.menu.db.label',
        i18nKey: 'app.menu.db.label',
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
        // Apply defaultOpen only when user has not explicitly chosen a state
        if (item.defaultOpen && typeof acc[item.label] === 'undefined') acc[item.label] = true;
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
          // Expand ancestors for active route unless the user explicitly collapsed them
          if (acc[item.label] !== false) {
            acc[item.label] = true;
          }
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


