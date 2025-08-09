import type { Route } from '@features/router/types';

export interface MenuItem {
  label: string;
  i18nKey?: string;
  route?: Route;
  children?: MenuItem[];
  defaultOpen?: boolean;
}


