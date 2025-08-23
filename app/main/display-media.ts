/**
 * Display Media Handler Module
 * Manages screen capture media requests for the application
 */

import { session, desktopCapturer, ipcMain, type IpcMainEvent } from 'electron';

type DisplayId = string | 'all' | null;
type MediaCallback = (streams: { video?: any; audio?: any }) => void;

let lastRequestedDisplayId: DisplayId = null;

/**
 * Initialize display media request handling
 */
export function initializeDisplayMedia(): void {
  // Listen for display selection changes from renderer
  ipcMain.on('screen:setPreviewDisplay', (_event: IpcMainEvent, displayId: DisplayId) => {
    if (!displayId || (typeof displayId !== 'string' && displayId !== 'all')) {
      console.error('[display-media] Invalid display ID received:', displayId);
      return;
    }
    lastRequestedDisplayId = displayId;
    console.log('[display-media] Preview display set to:', displayId);
  });

  // Set up display media request handler
  try {
    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
      handleDisplayMediaRequest(callback as MediaCallback).catch(error => {
        console.error('[display-media] Failed to handle display media request:', error);
        (callback as any)({ video: null, audio: false });
      });
    });
  } catch (error) {
    console.error('[display-media] Failed to set display media request handler:', error);
  }
}

/**
 * Handle display media request with proper error handling
 */
async function handleDisplayMediaRequest(callback: MediaCallback): Promise<void> {
  console.log('[display-media] Display media request received for display:', lastRequestedDisplayId);
  
  try {
    const sources = await desktopCapturer.getSources({ 
      types: ['screen'], 
      thumbnailSize: { width: 1920, height: 1080 } 
    });
    
    console.log('[display-media] Available sources:', sources.length);
    
    const sourceToUse = selectDisplaySource(sources);
    
    if (sourceToUse) {
      console.log('[display-media] Using source:', sourceToUse.name, 'ID:', sourceToUse.id);
      callback({ video: sourceToUse, audio: 'loopback' });
    } else {
      console.warn('[display-media] No suitable source found');
      // Provide fallback to first available source or null
      callback({ video: sources[0] || null, audio: sources.length > 0 ? 'loopback' : false });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[display-media] Error getting desktop sources:', errorMessage);
    callback({ video: null, audio: false });
  }
}

/**
 * Select the appropriate display source based on user preference
 */
function selectDisplaySource(sources: Electron.DesktopCapturerSource[]): Electron.DesktopCapturerSource | undefined {
  if (!sources.length) return undefined;
  
  let sourceToUse = sources[0]; // Default to first
  
  if (lastRequestedDisplayId && lastRequestedDisplayId !== 'all') {
    // Try to find the requested display
    const requestedSource = sources.find(source => 
      source.id === lastRequestedDisplayId || 
      source.display_id === lastRequestedDisplayId ||
      source.name.includes(`Display ${lastRequestedDisplayId}`)
    );
    
    if (requestedSource) {
      sourceToUse = requestedSource;
      console.log('[display-media] Found requested source:', requestedSource.name);
    } else {
      console.log('[display-media] Requested display not found, using primary');
      sourceToUse = findPrimarySource(sources) || sourceToUse;
    }
  } else if (lastRequestedDisplayId === 'all') {
    // For 'all', we can only show one at a time via getDisplayMedia
    // Use primary display
    sourceToUse = findPrimarySource(sources) || sourceToUse;
  }
  
  return sourceToUse;
}

/**
 * Find the primary display source
 */
function findPrimarySource(sources: Electron.DesktopCapturerSource[]): Electron.DesktopCapturerSource | undefined {
  return sources.find(source => 
    source.name.includes('Entire screen') || 
    source.name.includes('Screen 1') ||
    source.name.includes('Primary')
  );
}

/**
 * Clean up display media handlers
 */
export function cleanupDisplayMedia(): void {
  try {
    ipcMain.removeAllListeners('screen:setPreviewDisplay');
    lastRequestedDisplayId = null;
    console.log('[display-media] Cleanup completed');
  } catch (error) {
    console.error('[display-media] Error during cleanup:', error);
  }
}