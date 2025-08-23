/**
 * Screen Capture API for preload
 */

import { createInvokeWrapper, createSendWrapper, validatePath } from '../ipc-wrapper';
import type { CaptureOptions } from '../types';

export const screenApi = {
  getDisplays: createInvokeWrapper<[], any[]>('screen:getDisplays'),
  getSources: createInvokeWrapper<[], any[]>('screen:getSources'),
  setPreviewDisplay: createSendWrapper<[string | 'all']>('screen:setPreviewDisplay'),
  capture: createInvokeWrapper<[CaptureOptions?], any>('screen:capture'),
  
  captureDisplay(displayId: string, savePath?: string): Promise<any> {
    validatePath(displayId);
    if (savePath) validatePath(savePath);
    return createInvokeWrapper<[string, string?], any>('screen:captureDisplay')(displayId, savePath);
  },
  
  captureAll: createInvokeWrapper<[string?], any[]>('screen:captureAll'),
  list: createInvokeWrapper<[string?], any[]>('screen:list'),
  
  delete(filename: string, customPath?: string): Promise<boolean> {
    validatePath(filename);
    if (customPath) validatePath(customPath);
    return createInvokeWrapper<[string, string?], boolean>('screen:delete')(filename, customPath);
  },
  
  get(filename: string, customPath?: string): Promise<string | null> {
    validatePath(filename);
    if (customPath) validatePath(customPath);
    return createInvokeWrapper<[string, string?], string | null>('screen:get')(filename, customPath);
  },
};