export type Route =
  | 'home'
  | 'settings.config'
  | 'settings.about'
  | 'test.styleguide'
  | 'test.styleguide.base'
  | 'test.styleguide.inputs'
  | 'test.styleguide.buttons'
  | 'test.styleguide.table'
  | 'test.styleguide.components'
  | 'test.styleguide.search'
  | 'test.styleguide.record'
  | 'test.db.test-table'
  | 'test.styleguide.media'
  | 'test.styleguide.files'
  | 'test.styleguide.chatbot'
  | 'test.features'
  | 'test.features.local-files'
  | 'test.features.saved-local-folder';

export const ROUTES: Route[] = [
  'home',
  'settings.config',
  'settings.about',
  ...(import.meta.env.DEV ? ([
    'test.styleguide',
    'test.styleguide.base',
    'test.styleguide.inputs',
    'test.styleguide.buttons',
    'test.styleguide.table',
    'test.styleguide.components',
    'test.styleguide.search',
    'test.styleguide.record',
    'test.db.test-table',
    'test.styleguide.media',
    'test.styleguide.files',
    'test.styleguide.chatbot',
    'test.features',
    'test.features.local-files',
    'test.features.saved-local-folder',
  ] as Route[]) : []),
];


