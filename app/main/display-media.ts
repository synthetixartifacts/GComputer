/**
 * Display Media Handler Module
 * Manages screen capture media requests for the application
 */

import { session, desktopCapturer, ipcMain } from 'electron';

let lastRequestedDisplayId: string | null = null;

/**
 * Initialize display media request handling
 */
export function initializeDisplayMedia(): void {
  // Listen for display selection changes from renderer
  ipcMain.on('screen:setPreviewDisplay', (_, displayId: string | 'all') => {
    lastRequestedDisplayId = displayId;
    console.log('[display-media] Preview display set to:', displayId);
  });

  // Set up display media request handler
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    handleDisplayMediaRequest(callback);
  });
}

/**
 * Handle display media request
 */
async function handleDisplayMediaRequest(callback: (streams: { video?: any; audio?: any }) => void): Promise<void> {
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
      callback({ video: sourceToUse, audio: 'loopback' as any });
    } else {
      console.warn('[display-media] No sources available');
      // Return empty result when no sources available
      callback({ video: sources[0] || {} as any, audio: 'loopback' as any });
    }
  } catch (error) {
    console.error('[display-media] Error getting desktop sources:', error);
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
  ipcMain.removeAllListeners('screen:setPreviewDisplay');
  lastRequestedDisplayId = null;
}