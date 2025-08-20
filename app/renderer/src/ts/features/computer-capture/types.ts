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

export interface CaptureOptions {
  format?: 'png' | 'jpg';
  quality?: number;
}

export interface CaptureState {
  screenshots: Screenshot[];
  isCapturing: boolean;
  isLoading: boolean;
  error: string | null;
  lastCapturedId: string | null;
}