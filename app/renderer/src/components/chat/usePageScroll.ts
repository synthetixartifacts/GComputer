/**
 * Page scroll hook for chat messages
 * Scrolls the entire page instead of a container
 */

export function createPageScroll() {
  let shouldAutoScroll = true;
  let lastScrollHeight = 0;
  
  /**
   * Scroll to bottom of page immediately
   */
  function scrollToBottom() {
    window.scrollTo(0, document.body.scrollHeight);
  }
  
  /**
   * Scroll to bottom smoothly
   */
  function scrollToBottomSmooth() {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  }
  
  /**
   * Check if user has scrolled up
   */
  function checkUserScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.body.scrollHeight;
    const clientHeight = window.innerHeight;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // User has scrolled up if more than 100px from bottom
    shouldAutoScroll = distanceFromBottom < 100;
  }
  
  /**
   * Handle new content added
   */
  function handleContentAdded() {
    const currentScrollHeight = document.body.scrollHeight;
    if (currentScrollHeight !== lastScrollHeight) {
      lastScrollHeight = currentScrollHeight;
      
      if (shouldAutoScroll) {
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }
    }
  }
  
  /**
   * Force scroll on user action (like sending a message)
   */
  function forceScroll() {
    shouldAutoScroll = true;
    scrollToBottom();
  }
  
  /**
   * Initialize - scroll to bottom if needed
   */
  function init() {
    // Check if we're already at bottom or should scroll
    checkUserScroll();
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }
  
  /**
   * Cleanup
   */
  function destroy() {
    shouldAutoScroll = true;
    lastScrollHeight = 0;
  }
  
  return {
    init,
    scrollToBottom,
    scrollToBottomSmooth,
    checkUserScroll,
    handleContentAdded,
    forceScroll,
    destroy
  };
}