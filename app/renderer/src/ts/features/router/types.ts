export type Route =
  | 'home'
  | 'settings.config'
  | 'settings.about'
  | 'development.styleguide'
  | 'development.styleguide.base'
  | 'development.styleguide.inputs'
  | 'development.styleguide.buttons'
  | 'development.styleguide.table'
  | 'development.styleguide.components'
  | 'development.styleguide.search'
  | 'development.styleguide.record'
  | 'development.db.test-table'
  | 'development.styleguide.media'
  | 'development.styleguide.files'
  | 'development.styleguide.chatbot'
  | 'development.features'
  | 'development.features.local-files'
  | 'development.features.saved-local-folder'
  | 'development.features.capture-screen'
  | 'admin.entity.provider'
  | 'admin.entity.model'
  | 'admin.entity.agent'
  | 'admin.entity.configuration'
  | 'development.ai.communication'
  | 'discussion.list'
  | 'discussion.new'
  | 'discussion.chat';

export const ALL_ROUTES: Route[] = [
  'home',
  'settings.config',
  'settings.about',
  'development.styleguide',
  'development.styleguide.base',
  'development.styleguide.inputs',
  'development.styleguide.buttons',
  'development.styleguide.table',
  'development.styleguide.components',
  'development.styleguide.search',
  'development.styleguide.record',
  'development.db.test-table',
  'development.styleguide.media',
  'development.styleguide.files',
  'development.styleguide.chatbot',
  'development.features',
  'development.features.local-files',
  'development.features.saved-local-folder',
  'development.features.capture-screen',
  'admin.entity.provider',
  'admin.entity.model',
  'admin.entity.agent',
  'admin.entity.configuration',
  'development.ai.communication',
  'discussion.list',
  'discussion.new',
  'discussion.chat',
];

export const ROUTES = ALL_ROUTES;


