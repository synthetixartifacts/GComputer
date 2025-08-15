class ChatbotScrollManager extends BaseClass {
    constructor() {
        super();

        // Cached elements
        this.$chatzone    = $('#chatzone');
        this.$mainChatDiv = $('#main-chat');

        // Configuration
        this.topPadding = 50;

        // State flags
        this.isScrolling  = false;
        this.userScrolled = false;
        this.aiIsTalking  = false;

        // Initialize
        this.initScrollEvents();

        // Subscriptions
        this.subscribe('addedMsgToChatbox',   () => this.onAddedMsgToChatbox());
        this.subscribe('forceScrollBottom',   () => this.forceScrollBottom());
        this.subscribe('scrollBottom',        () => this.scrollToBottom());
        this.subscribe('scrollOneBottom',     () => this.scrollToNextMessage());
        this.subscribe('scrollTillLastMessageTop', () => this.scrollTillLastMessageTop());
        this.subscribe('aiStartTalking',      () => this.aiStartTalking());
        this.subscribe('aiStopTalking',       () => this.aiStopTalking());
    }

    /**
     * Attach event listeners for scrolling
     */
    initScrollEvents() {
        $('.scrollTop').on('click',       () => this.scrollToTop());
        $('.scrollBottom').on('click',    () => this.scrollToBottom());
        $('.scrollOneTop').on('click',    () => this.scrollToPreviousMessage());
        $('.scrollOneBottom').on('click', () => this.scrollToNextMessage());

        // Handle window scrolling
        $(window).on('scroll', this.throttle(() => this.onWindowScroll(), 10));
    }

    /**
     * Called when the AI starts talking
     */
    aiStartTalking() {
        this.aiIsTalking = true;
    }

    /**
     * Called when the AI stops talking
     */
    aiStopTalking() {
        this.aiIsTalking = false;
        this.userScrolled = false;
        this.onWindowScroll(); // Re-check scroll classes
        this.validateMsgNumber();
    }

    /**
     * Called when a new message is added to the chatbox
     */
    onAddedMsgToChatbox() {
        // Currently empty, but you could trigger an auto-scroll or something else
        // E.g. this.scrollToBottom();
    }

    /**
     * Smoothly scrolls to a given vertical position
     * @param {number} position - The vertical pixel position to scroll to
     * @param {boolean} [force=false] - Whether to force scrolling even if AI is talking
     */
    smoothScroll(position, force = false) {
        // If not currently scrolling, and either AI is not talking or user hasn't scrolled,
        // we can scroll. Also scroll if `force` is true.
        const canScroll = !this.isScrolling && !(this.aiIsTalking && this.userScrolled);
        if (canScroll || force) {
            this.isScrolling = true;

            window.scrollTo({
                top: position,
                behavior: 'smooth'
            });

            // Reset isScrolling after animation completes
            // 500ms is a reasonable duration for smooth scroll
            setTimeout(() => {
                this.isScrolling = false;
            }, 500);
        }
    }

    /**
     * Scroll to top of the page
     */
    scrollToTop() {
        this.smoothScroll(0);
    }

    /**
     * Scroll to bottom of the page
     */
    scrollToBottom() {
        const docHeight = $(document).height();
        this.smoothScroll(docHeight);
    }

    /**
     * Force scrolling to bottom regardless of AI or user scroll states
     */
    forceScrollBottom() {
        const docHeight = $(document).height();
        this.smoothScroll(docHeight, true);
    }

    /**
     * Scroll until the last message is near the top.
     * If the last message is already visible, scroll to bottom instead.
     */
    scrollTillLastMessageTop() {
        const $lastMessage = this.$mainChatDiv.find('.chat-text').not('.thinking').last();
        if ($lastMessage.length === 0) return;

        // Position of the last message in the viewport
        const lastMessageTop = $lastMessage[0].getBoundingClientRect().top;
        // const windowHeight   = $(window).height();

        // If the last message is somewhat below the top, we scroll all the way to bottom
        if (lastMessageTop >= 70) {
            this.scrollToBottom();
        }
    }

    /**
     * Scroll to the previous chat-text element above the current scroll position
     */
    scrollToPreviousMessage() {
        const currentScrollPos = $(window).scrollTop();
        let foundCurrent    = false;
        let $previousMessage = null;

        $('.chat-text').each((_, el) => {
            const $el = $(el);
            const messageTop = $el.offset().top;

            // If the message is above the current scroll,
            // track the closest one
            if (messageTop < currentScrollPos) {
                if (!$previousMessage || messageTop > $previousMessage.offset().top) {
                    foundCurrent    = true;
                    $previousMessage = $el;
                }
            }
        });

        if (foundCurrent && $previousMessage) {
            this.smoothScroll($previousMessage.offset().top - this.topPadding);
        }
    }

    /**
     * Scroll to the next chat-text element below the current scroll position
     */
    scrollToNextMessage() {
        const currentScrollPos = $(window).scrollTop();
        let foundCurrent = false;

        const $messages = $('.chat-text');
        for (let i = 0; i < $messages.length; i++) {
            const $el       = $($messages[i]);
            const messageTop = $el.offset().top;

            if (messageTop > currentScrollPos) {
                if (foundCurrent) {
                    this.smoothScroll(messageTop - this.topPadding);
                    return;
                }
                foundCurrent = true;
            }
        }
    }

    /**
     * Called on window scroll. Manages chatzone classes and userScrolled state.
     */
    onWindowScroll() {
        const scrollTop    = $(window).scrollTop();
        const scrollHeight = $(document).height();
        const windowHeight = $(window).height();

        // Toggle classes for top scrolling
        if (scrollTop <= 10) {
            this.$chatzone.removeClass('chatzone-scrollable-to-top');
        } else {
            this.$chatzone.addClass('chatzone-scrollable-to-top');
        }

        // Toggle classes for bottom scrolling
        if (scrollTop + windowHeight >= scrollHeight - 10) {
            this.$chatzone.removeClass('chatzone-scrollable-to-bottom');
        } else {
            this.$chatzone.addClass('chatzone-scrollable-to-bottom');
        }

        // If user manually scrolled while AI was talking, set userScrolled to true
        if (!this.isScrolling && this.aiIsTalking) {
            this.userScrolled = true;
        }

        // Update copy button positions for all code blocks
        this.updateCopyButtonPositions();
    }

    updateCopyButtonPositions() {
        $('.code-section').each(function() {
            const $codeSection = $(this);
            // Get the top offset and total height of the code block
            const codeOffsetTop = $codeSection.offset().top;
            const codeHeight = $codeSection.outerHeight();

            // Current scroll position
            const scrollTop = $(window).scrollTop();

            // Find the copy button inside this code block
            const $copyButton = $codeSection.find('.copy_code');

            // If we haven't scrolled past the top of the code block, leave it at its default position
            if (scrollTop < codeOffsetTop) {
                $copyButton.removeClass('sticky');
                $copyButton.css({ position: '', top: '' });
            } else {
                // Calculate how far the window has scrolled past the top of the code block
                const newTop = scrollTop - codeOffsetTop + 50;
                // Get the copy button's height
                const buttonHeight = $copyButton.outerHeight();

                const maxTop = codeHeight - buttonHeight;
                // Use whichever is less: the calculated offset or the maximum allowed
                const finalTop = Math.min(newTop, maxTop);

                // Set the copy button's position to absolute relative to the code block
                // (Ensure that .code-section is position: relative in your CSS.)
                $copyButton.addClass('sticky');
                $copyButton.css({
                    position: 'absolute',
                    top: finalTop + 'px',
                    right: '10px'
                });
            }
        });
    }


    /**
     * Adjusts chatzone classes based on how many messages exist
     */
    validateMsgNumber() {
        const chatTextsNumber = this.$mainChatDiv.find('.chat-text').length;

        if (chatTextsNumber <= 2) {
            this.$chatzone.addClass('message-under-two')
                          .removeClass('message-over-two');
        } else {
            this.$chatzone.addClass('message-over-two')
                          .removeClass('message-under-two');
        }
    }
}

// Autoload scroll manager
const chatbotScrollManager = new ChatbotScrollManager();
