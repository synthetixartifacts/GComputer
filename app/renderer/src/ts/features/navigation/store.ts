import { derived, writable } from 'svelte/store';
import type { MenuItem } from './types';
import type { Route } from '@features/router/types';

export const menuItems = writable<MenuItem[]>([
  { label: 'app.menu.home', i18nKey: 'app.menu.home', route: 'home' },
  {
    label: 'app.menu.settings',
    i18nKey: 'app.menu.settings',
    children: [
      { label: 'app.menu.config', i18nKey: 'app.menu.config', route: 'settings.config' },
      { label: 'app.menu.about', i18nKey: 'app.menu.about', route: 'settings.about' },
    ],
  },
  ...(import.meta.env.DEV
    ? ([
        {
          label: 'app.menu.test',
          i18nKey: 'app.menu.test',
          children: [
            {
              label: 'app.menu.styleguide.label',
              i18nKey: 'app.menu.styleguide.label',
              children: [
                { label: 'app.menu.styleguide.base', i18nKey: 'app.menu.styleguide.base', route: 'development.styleguide.base' as Route },
                { label: 'app.menu.styleguide.inputs', i18nKey: 'app.menu.styleguide.inputs', route: 'development.styleguide.inputs' as Route },
                { label: 'app.menu.styleguide.buttons', i18nKey: 'app.menu.styleguide.buttons', route: 'development.styleguide.buttons' as Route },
                { label: 'app.menu.styleguide.table', i18nKey: 'app.menu.styleguide.table', route: 'development.styleguide.table' as Route },
                { label: 'app.menu.styleguide.components', i18nKey: 'app.menu.styleguide.components', route: 'development.styleguide.components' as Route },
                { label: 'app.menu.styleguide.search', i18nKey: 'app.menu.styleguide.search', route: 'development.styleguide.search' as Route },
                { label: 'app.menu.styleguide.record', i18nKey: 'app.menu.styleguide.record', route: 'development.styleguide.record' as Route },
                { label: 'app.menu.styleguide.media', i18nKey: 'app.menu.styleguide.media', route: 'development.styleguide.media' as Route },
                { label: 'app.menu.styleguide.files', i18nKey: 'app.menu.styleguide.files', route: 'development.styleguide.files' as Route },
                { label: 'app.menu.styleguide.chatbot', i18nKey: 'app.menu.styleguide.chatbot', route: 'development.styleguide.chatbot' as Route },
              ],
            },
            {
              label: 'app.menu.features.label',
              i18nKey: 'app.menu.features.label',
              children: [
                { label: 'app.menu.features.localFiles', i18nKey: 'app.menu.features.localFiles', route: 'development.features.local-files' as Route },
                { label: 'app.menu.features.savedLocalFolder', i18nKey: 'app.menu.features.savedLocalFolder', route: 'development.features.saved-local-folder' as Route },
              ],
            },
            {
              label: 'app.menu.db.label',
              i18nKey: 'app.menu.db.label',
              children: [
                { label: 'app.menu.db.testTable', i18nKey: 'app.menu.db.testTable', route: 'development.db.test-table' as Route },
              ],
            },
            {
              label: 'app.menu.ai.label',
              i18nKey: 'app.menu.ai.label',
              children: [
                { label: 'app.menu.ai.communication', i18nKey: 'app.menu.ai.communication', route: 'development.ai.communication' as Route },
              ],
            },
          ],
        },
        {
          label: 'app.menu.admin.label',
          i18nKey: 'app.menu.admin.label',
          children: [
            {
              label: 'app.menu.admin.entity.label',
              i18nKey: 'app.menu.admin.entity.label',
              children: [
                {
                  label: 'app.menu.admin.entity.llm.label',
                  i18nKey: 'app.menu.admin.entity.llm.label',
                  children: [
                    { label: 'app.menu.admin.entity.llm.provider', i18nKey: 'app.menu.admin.entity.llm.provider', route: 'admin.entity.provider' as Route },
                    { label: 'app.menu.admin.entity.llm.model', i18nKey: 'app.menu.admin.entity.llm.model', route: 'admin.entity.model' as Route },
                    { label: 'app.menu.admin.entity.llm.agent', i18nKey: 'app.menu.admin.entity.llm.agent', route: 'admin.entity.agent' as Route },
                  ],
                },
              ],
            },
          ],
        },
      ] as MenuItem[])
    : []),
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


