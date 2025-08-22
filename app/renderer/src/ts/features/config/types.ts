export type ConfigMode = 'production' | 'dev' | 'beta';

export interface AppConfig {
  mode: ConfigMode;
  features: {
    development: boolean;
    admin: boolean;
    beta: boolean;
  };
}

export const DEV_ROUTES = [
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
  'development.ai.communication',
] as const;

export const ADMIN_ROUTES = [
  'admin.entity.provider',
  'admin.entity.model',
  'admin.entity.agent',
] as const;

export const BASE_ROUTES = [
  'home',
  'settings.config',
  'settings.about',
  'discussion.list',
  'discussion.new',
  'discussion.chat',
] as const;