import { pageTitle, pageActions } from '@features/ui/store';
import type { PageAction } from '@features/ui/types';

export function setPageTitle(title: string): void {
  pageTitle.set(title);
}

export function clearPageTitle(): void {
  pageTitle.set('');
}

export function setPageActions(actions: PageAction[]): void {
  pageActions.set(actions);
}

export function clearPageActions(): void {
  pageActions.set([]);
}

export function addPageAction(action: PageAction): void {
  pageActions.update((actions) => [...actions, action]);
}

export function removePageAction(id: string): void {
  pageActions.update((actions) => actions.filter((a) => a.id !== id));
}