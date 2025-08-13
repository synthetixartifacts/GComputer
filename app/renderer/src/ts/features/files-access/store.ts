import { writable } from 'svelte/store';
import type { FileAccessItem, UiFileItem } from './types';
import { mapFilesToItems, deriveRootFolderName, toUiItems } from './service';

export const pickedItems = writable<FileAccessItem[]>([]);
export const rootFolderName = writable<string | null>(null);
export const uiItems = writable<UiFileItem[]>([]);
export const isRecursive = writable<boolean>(false);

export function setPickedFiles(files: File[] | FileList): void {
  const items = mapFilesToItems(files);
  pickedItems.set(items);
  rootFolderName.set(deriveRootFolderName(items));
  let recursive: boolean = false;
  const unsub = isRecursive.subscribe((v) => (recursive = v));
  unsub();
  uiItems.set(toUiItems(items, { recursive }));
}

export function setRecursive(value: boolean): void {
  isRecursive.set(value);
  let items: FileAccessItem[] = [];
  const unsub = pickedItems.subscribe((v) => (items = v));
  unsub();
  uiItems.set(toUiItems(items, { recursive: value }));
}

export function unloadPickedFiles(): void {
  pickedItems.set([]);
  rootFolderName.set(null);
  uiItems.set([]);
}


