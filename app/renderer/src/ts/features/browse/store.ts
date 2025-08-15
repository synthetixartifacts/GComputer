import { writable } from 'svelte/store';
import type { BrowseItem } from './types';
import { listDirectory } from './service';

export const pathStore = writable<string>('');
export const itemsStore = writable<BrowseItem[]>([]);

export async function browse(): Promise<void> {
  try {
    let path: string = '';
    const unsubscribe = pathStore.subscribe((v) => (path = v));
    unsubscribe();
    const items = await listDirectory(path);
    itemsStore.set(items);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
}


