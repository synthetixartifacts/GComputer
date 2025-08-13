import { writable } from 'svelte/store';
import type { FileAccessItem, UiFileItem } from './types';
import { mapFilesToItems, deriveRootFolderName, toUiItems } from './service';

export const pickedItems = writable<FileAccessItem[]>([]);
export const rootFolderName = writable<string | null>(null);
export const uiItems = writable<UiFileItem[]>([]);

export function setPickedFiles(files: File[] | FileList): void {
  const items = mapFilesToItems(files);
  pickedItems.set(items);
  rootFolderName.set(deriveRootFolderName(items));
  uiItems.set(toUiItems(items));
}


