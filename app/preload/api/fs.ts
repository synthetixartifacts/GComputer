/**
 * File System API for preload
 */

import { createInvokeWrapper, validatePath } from '../ipc-wrapper';
import type { FsListedItem } from '../types';

export const fsApi = {
  listDirectory(path: string): Promise<FsListedItem[]> {
    validatePath(path);
    return createInvokeWrapper<[{ path: string }], FsListedItem[]>('fs:list-directory')({ path });
  },
};