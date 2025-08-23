/**
 * Type definitions for screen capture functionality
 */

export interface Screenshot {
  id: string;
  filename: string;
  path: string;
  size: number;
  createdAt: number;
  width: number;
  height: number;
  displayId?: string;
}

export interface DisplayInfo {
  id: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  workArea: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
  rotation: number;
  isPrimary: boolean;
}

export interface ScreenSource {
  id: string;
  name: string;
  thumbnail: string | null;
  display_id: string;
  displayInfo: DisplayInfo | null;
}

export interface CaptureOptions {
  sourceId?: string;
  savePath?: string;
}

export interface ThumbnailSize {
  width: number;
  height: number;
}