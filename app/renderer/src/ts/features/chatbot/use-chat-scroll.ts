/**
 * Svelte hook for chat scroll behavior
 * Provides reactive scroll management for chat components
 */

import { onMount, onDestroy } from 'svelte';
import { ChatScrollManager, type ScrollManagerOptions } from './scroll-manager';
import type { Readable } from 'svelte/store';

export interface UseChatScrollOptions extends ScrollManagerOptions {
  containerRef?: HTMLElement | null;
  messageCount?: number;
  isStreaming?: boolean;
  onScrollStateChange?: (isUserScrolling: boolean, isNearBottom: boolean) => void;
}

export interface ChatScrollHook {
  scrollManager: ChatScrollManager;
  attachContainer: (element: HTMLElement) => void;
  handleNewUserMessage: () => void;
  handleStreamingStart: () => void;
  handleStreamingUpdate: () => void;
  handleStreamingComplete: () => void;
}

/**
 * Create a chat scroll hook for Svelte components
 */
export function useChatScroll(options: UseChatScrollOptions = {}): ChatScrollHook {
  const scrollManager = new ChatScrollManager(options);
  let previousMessageCount = options.messageCount ?? 0;
  let attachedElement: HTMLElement | null = null;

  // Attach container helper
  const attachContainer = (element: HTMLElement) => {
    if (attachedElement) {
      scrollManager.detach();
    }
    attachedElement = element;
    scrollManager.attach(element);
    
    // Initial scroll to bottom
    scrollManager.scrollToBottom(true);
  };

  // Handle new user message
  const handleNewUserMessage = () => {
    scrollManager.onUserMessageSent();
  };

  // Handle streaming lifecycle
  const handleStreamingStart = () => {
    scrollManager.onStreamingStart();
  };

  const handleStreamingUpdate = () => {
    scrollManager.onStreamingUpdate();
  };

  const handleStreamingComplete = () => {
    scrollManager.onStreamingComplete();
  };

  // Watch for message count changes (if provided)
  if (options.messageCount !== undefined) {
    // This will be called in a reactive context
    if (options.messageCount > previousMessageCount) {
      // New message added
      if (scrollManager.shouldAutoScroll()) {
        setTimeout(() => scrollManager.scrollToBottom(), 0);
      }
      previousMessageCount = options.messageCount;
    }
  }

  // Watch for streaming state changes (if provided)
  if (options.isStreaming !== undefined) {
    // Handle streaming state transitions
    // This logic will be called in reactive contexts
  }

  // Cleanup on destroy
  onDestroy(() => {
    scrollManager.detach();
  });

  return {
    scrollManager,
    attachContainer,
    handleNewUserMessage,
    handleStreamingStart,
    handleStreamingUpdate,
    handleStreamingComplete
  };
}

/**
 * Create a reactive chat scroll hook that responds to store changes
 */
export function useChatScrollWithStores(
  messageStore?: Readable<any[]>,
  streamingStore?: Readable<boolean>,
  options: ScrollManagerOptions = {}
): ChatScrollHook {
  const hook = useChatScroll(options);
  let previousMessageCount = 0;
  let wasStreaming = false;

  onMount(() => {
    // Subscribe to message store if provided
    const unsubMessages = messageStore?.subscribe(messages => {
      const newCount = messages.length;
      if (newCount > previousMessageCount && previousMessageCount > 0) {
        // New message detected
        if (hook.scrollManager.shouldAutoScroll()) {
          setTimeout(() => hook.scrollManager.scrollToBottom(), 50);
        }
      }
      previousMessageCount = newCount;
    });

    // Subscribe to streaming store if provided
    const unsubStreaming = streamingStore?.subscribe(isStreaming => {
      if (isStreaming && !wasStreaming) {
        hook.handleStreamingStart();
      } else if (!isStreaming && wasStreaming) {
        hook.handleStreamingComplete();
      }
      wasStreaming = isStreaming;
    });

    // Cleanup subscriptions
    return () => {
      unsubMessages?.();
      unsubStreaming?.();
    };
  });

  return hook;
}