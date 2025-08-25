/**
 * Scroll behavior configuration constants
 * Centralized configuration for all scroll-related timings and thresholds
 */

export const SCROLL_CONFIG = {
  // Timing delays (in milliseconds)
  INITIAL_LOAD_DELAY: 100,      // Delay before initial scroll on page load
  MOUNT_SCROLL_DELAY: 150,      // Delay after component mount
  USER_MESSAGE_RESET_DELAY: 500, // Time to keep user message trigger active
  
  // Distance thresholds (in pixels)  
  USER_SCROLL_THRESHOLD: 100,   // Distance from bottom to detect user scrolling
  STREAM_SCROLL_THRESHOLD: 50,  // Threshold for stream scroll detection
  
  // Throttle/debounce timings
  STREAM_THROTTLE_MS: 100,       // Throttle streaming updates
  SCROLL_DEBOUNCE_MS: 50,        // Debounce scroll events
} as const;

// Type for scroll configuration
export type ScrollConfig = typeof SCROLL_CONFIG;