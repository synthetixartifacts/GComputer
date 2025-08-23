/**
 * Display management service for screen capture
 */

import { screen, desktopCapturer } from 'electron';
import type { DisplayInfo, ScreenSource } from './types.js';

/**
 * Get all available displays with full information
 */
export function getAllDisplays(): DisplayInfo[] {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();
  
  return displays.map((display, index) => ({
    id: display.id.toString(),
    name: display.id === primaryDisplay.id ? 'Primary Display' : `Display ${index + 1}`,
    bounds: display.bounds,
    workArea: display.workArea,
    scaleFactor: display.scaleFactor || 1,
    rotation: display.rotation || 0,
    isPrimary: display.id === primaryDisplay.id
  }));
}

/**
 * Get available screen sources for preview
 */
export async function getScreenSources(): Promise<ScreenSource[]> {
  const displays = getAllDisplays();
  
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 320, height: 240 }
    });
    
    console.log(`[Screen Capture] Got ${sources.length} sources for preview`);
    
    return sources.map(source => {
      const display = displays.find(d => d.id === source.display_id);
      const thumbnail = source.thumbnail && !source.thumbnail.isEmpty() 
        ? source.thumbnail.toDataURL()
        : null;
      
      return {
        id: source.id,
        name: display ? display.name : source.name,
        thumbnail,
        display_id: source.display_id,
        displayInfo: display || null
      };
    });
  } catch (error) {
    console.error('[Screen Capture] Error getting sources:', error);
    return displays.map(display => ({
      id: `screen:${display.id}`,
      name: display.name,
      thumbnail: null,
      display_id: display.id,
      displayInfo: display
    }));
  }
}