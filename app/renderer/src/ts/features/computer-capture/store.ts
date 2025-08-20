import { writable } from 'svelte/store';
import type { CaptureState } from './types';

const initialState: CaptureState = {
  screenshots: [],
  isCapturing: false,
  isLoading: false,
  error: null,
  lastCapturedId: null
};

export const captureState = writable<CaptureState>(initialState);

export function setScreenshots(screenshots: CaptureState['screenshots']): void {
  captureState.update(state => ({
    ...state,
    screenshots,
    error: null
  }));
}

export function setCapturing(isCapturing: boolean): void {
  captureState.update(state => ({
    ...state,
    isCapturing,
    error: isCapturing ? null : state.error
  }));
}

export function setLoading(isLoading: boolean): void {
  captureState.update(state => ({
    ...state,
    isLoading,
    error: isLoading ? null : state.error
  }));
}

export function setError(error: string | null): void {
  captureState.update(state => ({
    ...state,
    error,
    isCapturing: false,
    isLoading: false
  }));
}

export function setLastCapturedId(id: string | null): void {
  captureState.update(state => ({
    ...state,
    lastCapturedId: id
  }));
}

export function addScreenshot(screenshot: CaptureState['screenshots'][0]): void {
  captureState.update(state => ({
    ...state,
    screenshots: [screenshot, ...state.screenshots],
    lastCapturedId: screenshot.id,
    isCapturing: false,
    error: null
  }));
}

export function removeScreenshot(id: string): void {
  captureState.update(state => ({
    ...state,
    screenshots: state.screenshots.filter(s => s.id !== id),
    lastCapturedId: state.lastCapturedId === id ? null : state.lastCapturedId
  }));
}