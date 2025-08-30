/**
 * Chat scroll manager for consistent scroll behavior across all chat components
 * Handles auto-scrolling on new messages and intelligent scrolling during streaming
 */

export interface ScrollManagerOptions {
  scrollThreshold?: number; // Distance from bottom to consider "near bottom"
  scrollBehavior?: ScrollBehavior; // smooth or auto
  enableAutoScroll?: boolean;
}

export interface ScrollState {
  isUserScrolling: boolean;
  isNearBottom: boolean;
  lastScrollTop: number;
  lastScrollHeight: number;
}

export class ChatScrollManager {
  private container: HTMLElement | null = null;
  private state: ScrollState = {
    isUserScrolling: false,
    isNearBottom: true,
    lastScrollTop: 0,
    lastScrollHeight: 0
  };
  private options: Required<ScrollManagerOptions>;
  private isStreaming = false;
  private streamStartScrollTop = 0;

  /**
   * Check if scroll manager is attached to a container
   */
  get isAttached(): boolean {
    return this.container !== null;
  }

  constructor(options: ScrollManagerOptions = {}) {
    this.options = {
      scrollThreshold: options.scrollThreshold ?? 100,
      scrollBehavior: options.scrollBehavior ?? 'smooth',
      enableAutoScroll: options.enableAutoScroll ?? true
    };
  }

  /**
   * Attach the scroll manager to a container element
   */
  attach(container: HTMLElement): void {
    this.container = container;
    this.updateScrollState();
    this.container.addEventListener('scroll', this.handleScroll);
  }

  /**
   * Detach the scroll manager from the container
   */
  detach(): void {
    if (this.container) {
      this.container.removeEventListener('scroll', this.handleScroll);
      this.container = null;
    }
  }

  /**
   * Handle scroll events to track user interaction
   */
  private handleScroll = (): void => {
    if (!this.container) return;
    
    const previousNearBottom = this.state.isNearBottom;
    this.updateScrollState();
    
    // Detect user-initiated scrolling
    if (this.isStreaming) {
      // During streaming, check if user scrolled up
      if (this.container.scrollTop < this.streamStartScrollTop - 50) {
        this.state.isUserScrolling = true;
      }
    } else {
      // Not streaming - check if user scrolled away from bottom
      if (previousNearBottom && !this.state.isNearBottom) {
        this.state.isUserScrolling = true;
      }
    }
    
    // Reset user scrolling flag if they scroll back to bottom
    if (this.state.isNearBottom) {
      this.state.isUserScrolling = false;
    }
  };

  /**
   * Update the current scroll state
   */
  private updateScrollState(): void {
    if (!this.container) return;
    
    const { scrollTop, scrollHeight, clientHeight } = this.container;
    
    this.state.lastScrollTop = scrollTop;
    this.state.lastScrollHeight = scrollHeight;
    this.state.isNearBottom = 
      scrollHeight - scrollTop - clientHeight < this.options.scrollThreshold;
  }

  /**
   * Scroll to the bottom of the container
   */
  scrollToBottom(immediate = false): void {
    if (!this.container || !this.options.enableAutoScroll) {
      return;
    }
    
    const scrollHeight = this.container.scrollHeight;
    const clientHeight = this.container.clientHeight;
    const targetScrollTop = scrollHeight - clientHeight;
    
    // Force scroll using scrollTop
    if (targetScrollTop > 0) {
      this.container.scrollTop = targetScrollTop;
    }
    
    this.state.isUserScrolling = false;
    this.updateScrollState();
  }

  /**
   * Handle when a new user message is sent
   */
  onUserMessageSent(): void {
    // Always scroll to bottom on user message
    this.scrollToBottom();
  }

  /**
   * Handle when AI streaming starts
   */
  onStreamingStart(): void {
    this.isStreaming = true;
    if (this.container) {
      this.streamStartScrollTop = this.container.scrollTop;
    }
    
    // Auto-scroll to bottom if user isn't actively scrolling
    if (!this.state.isUserScrolling) {
      this.scrollToBottom();
    }
  }

  /**
   * Handle streaming content updates
   */
  onStreamingUpdate(): void {
    if (!this.isStreaming || !this.container) return;
    
    // Only auto-scroll if user hasn't scrolled away
    if (!this.state.isUserScrolling && this.options.enableAutoScroll) {
      // Use immediate scroll during streaming for smooth experience
      this.scrollToBottom(true);
    }
  }

  /**
   * Handle when streaming completes
   */
  onStreamingComplete(): void {
    this.isStreaming = false;
    
    // Final smooth scroll if we were auto-scrolling
    if (!this.state.isUserScrolling && this.options.enableAutoScroll) {
      this.scrollToBottom(false);
    }
  }

  /**
   * Check if should auto-scroll based on current state
   */
  shouldAutoScroll(): boolean {
    return this.options.enableAutoScroll && 
           !this.state.isUserScrolling && 
           (this.state.isNearBottom || this.isStreaming);
  }

  /**
   * Get current scroll state
   */
  getState(): Readonly<ScrollState> {
    return { ...this.state };
  }

  /**
   * Update options dynamically
   */
  updateOptions(options: Partial<ScrollManagerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Reset the scroll manager state
   */
  reset(): void {
    this.state = {
      isUserScrolling: false,
      isNearBottom: true,
      lastScrollTop: 0,
      lastScrollHeight: 0
    };
    this.isStreaming = false;
    this.streamStartScrollTop = 0;
  }
}

/**
 * Create a scroll manager instance with default chat settings
 */
export function createChatScrollManager(options?: ScrollManagerOptions): ChatScrollManager {
  return new ChatScrollManager({
    scrollThreshold: 100,
    scrollBehavior: 'smooth',
    enableAutoScroll: true,
    ...options
  });
}