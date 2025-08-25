/**
 * Utility for managing body scroll lock
 * Prevents body scrolling when modals/sidebars are open
 */

let scrollLockCount = 0;
let originalOverflow: string | null = null;
let originalPaddingRight: string | null = null;

/**
 * Lock body scroll
 * Handles multiple locks with reference counting
 */
export function lockBodyScroll(): void {
  if (scrollLockCount === 0) {
    // Store original values
    originalOverflow = document.body.style.overflow;
    originalPaddingRight = document.body.style.paddingRight;
    
    // Calculate scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // Apply scroll lock
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.classList.add('gc-no-scroll');
  }
  scrollLockCount++;
}

/**
 * Unlock body scroll
 * Only unlocks when all locks are released
 */
export function unlockBodyScroll(): void {
  scrollLockCount--;
  if (scrollLockCount <= 0) {
    scrollLockCount = 0;
    // Restore original values
    if (originalOverflow !== null) {
      document.body.style.overflow = originalOverflow;
    } else {
      document.body.style.removeProperty('overflow');
    }
    
    if (originalPaddingRight !== null) {
      document.body.style.paddingRight = originalPaddingRight;
    } else {
      document.body.style.removeProperty('padding-right');
    }
    document.body.classList.remove('gc-no-scroll');
  }
}

/**
 * Force unlock all scroll locks
 * Use with caution - only for cleanup scenarios
 */
export function forceUnlockBodyScroll(): void {
  scrollLockCount = 0;
  if (originalOverflow !== null) {
    document.body.style.overflow = originalOverflow;
  } else {
    document.body.style.removeProperty('overflow');
  }
  
  if (originalPaddingRight !== null) {
    document.body.style.paddingRight = originalPaddingRight;
  } else {
    document.body.style.removeProperty('padding-right');
  }
  document.body.classList.remove('gc-no-scroll');
}

/**
 * Get current lock count
 */
export function getScrollLockCount(): number {
  return scrollLockCount;
}