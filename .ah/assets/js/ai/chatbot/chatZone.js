/**
 * Manages the chat interface for a chatbot application.
 */
class ChatbotChatZone extends BaseClass {
    constructor() {
        super();

        // Cached elements
        this.$mainChatDiv = $('#main-chat');
        this.$thinkingDiv = $('#main-chat .thinking');

        // State
        this.aiIsTalking  = false;
        this.agent        = null;

        // Subscriptions
        this.subscribe('loadAgent',           (agent)   => this.loadAgent(agent));
        this.subscribe('discussionLoaded',    (disc)    => this.discussionLoaded(disc));
        this.subscribe('userMessageSubmit',   (info)    => this.userMessageSubmit(info));
        this.subscribe('aiStreamMsgReturned', (msg)     => this.aiStreamMsgReturned(msg));
        this.subscribe('aiStreamMsgError',    (error)   => this.aiStreamMsgError(error));
        this.subscribe('aiStartThinking',     ()        => this.aiStartThinking());
        this.subscribe('aiStopTalking',       ()        => this.aiStopTalking());
        this.subscribe('clearMessages',       ()        => this.clearMessages());
        this.subscribe('addAIMessageToDOM',   (msg)     => this.addAIMessageToDOM(msg));
        this.subscribe('removePartialAIResponse', ()    => this.removePartialAIResponse());
        this.subscribe('removeLastUserMessage', ()      => this.removeLastUserMessage());


        // Initialize DOM events
        this.initEvents();
    }

    /**
     * Attach DOM event handlers
     */
    initEvents() {
        // Toggle the content of 'thinking-process' when its label is clicked
        $('body').on('click', '.thinking-process.done-thinking .thinking-label', function() {
            // Keep "this" reference to the clicked label
            $(this).parent().find('.content').toggle();
        });
    }

    /**
     * Store agent data when loaded
     * @param {Object} agent - Agent details
     */
    loadAgent(agent) {
        this.agent = agent;
    }

    /**
     * Populate the chat with an existing discussion
     * @param {Object} discussion - Contains discussion content
     */
    discussionLoaded(discussion) {
        const conversation = discussion.content || [];

        this.clearMessages();

        // Populate user or assistant messages in the DOM
        conversation.forEach((message) => {
            if (message.role === 'user') {
                this.userMessageSubmit(message, false);
            } else if (message.role === 'assistant') {
                this.addAIMessageToDOM(message.msg);
            }
        });

        // Hide the thinking indicator initially
        this.$thinkingDiv.hide();

        // Force scroll to bottom and stop AI talking
        this.trigger('forceScrollBottom');
        this.trigger('aiStopTalking');
    }

    /**
     * Creates the DOM for a user/assistant message
     * @param {String} className   - Additional class (e.g., 'chat-user', 'chat-ai')
     * @param {String} rawMsg      - The raw message content (unescaped)
     * @param {String} formattedMsg - The message content with formatting/HTML
     * @returns {String} HTML string for the message element
     */
    createMessageElement(className, rawMsg, formattedMsg) {
        // Clear the "new conversation" info if present
        $('#new_conversation_infos').html('');

        // If no message, return an empty string
        if (!rawMsg) return '';

        // Copy button HTML
        var copyDiv = `
            <div class="ai-text-copy">
                <div class="copy_msg">${translations['messages.Copy']}</div>
            </div>
        `;

        if (AgentTool.getConfigurationValue(this.agent, 'voiceEnable', false) &&
            className == 'chat-ai') {
            copyDiv += `
            <div class="ai-audio-tts to-load">
                <div class="audio_tts_ready"></div>
            </div>
            `;
        }

        // Return final message HTML
        return `
            <div class="chat-text ${className}" data-raw-msg="${rawMsg}">
                <div class="realMsg">${formattedMsg}</div>
                ${copyDiv}
            </div>
        `;
    }

    /**
     * Creates the DOM for attached file(s)
     * @param {Array} files - Array of file objects
     * @returns {String} HTML string for file elements
     */
    createFileElement(files) {
        if (!files || files.length === 0) return '';

        // Create a container div
        const $container = $('<div>', { class: 'chat-text file-list' });

        // Generate and append file items with the central fileRenderer
        files.forEach(file => {
            const $fileItem = fileRenderer.renderFileItem(file, {
                showDelete: false,
                showPreview: true
            });
            $container.append($fileItem);
        });

        return $container;
    }

    /**
     * Adds an AI message to the chat DOM
     * @param {String} msg - AI message in string form
     */
    addAIMessageToDOM(msg) {
        const formattedHtml = messageFormatter.formatMessage(msg);
        const rawHtml       = messageFormatter.escapeHtml(msg);
        const domMsg        = this.createMessageElement('chat-ai', rawHtml, formattedHtml);

        // Insert AI message before the thinking element
        this.$thinkingDiv.before(domMsg);

        // Trigger an event that a message was added
        this.trigger('addedMsgToChatbox');
    }

    /**
     * Adds a user message to the chat (includes optional file attachments)
     * @param {Object} info - Contains { msg, files }
     * @param {Boolean} [scroll=true] - Whether to scroll after insertion
     */
    userMessageSubmit(info, scroll = true) {
        const formattedHtml = messageFormatter.formatMessage(info.msg, false);
        const rawHtml       = messageFormatter.escapeHtml(info.msg);
        const domMsg        = this.createMessageElement('chat-user', rawHtml, formattedHtml);

        // Create file elements if any
        const fileElement = this.createFileElement(info.files);

        // Insert file and user message before the thinking div
        this.$thinkingDiv.before(fileElement);
        this.$thinkingDiv.before(domMsg);

        // Trigger an event that a message was added
        this.trigger('addedMsgToChatbox');

        if (scroll) {
            this.scrollToBottom();
        }
    }

    /**
     * Updates the AI message currently "streaming" text from the server
     * @param {String} msg - The latest chunk of AI message text
     */
    aiStreamMsgReturned(msg) {
        if (!this.aiIsTalking) {
            this.startAITalking();
        }

        // Find the currently talking AI message
        const $talkingDiv   = $('.chat-ai.talking');
        const currentRawMsg = $talkingDiv.attr('data-raw-msg') || '';

        // Append new message chunk
        $talkingDiv.attr('data-raw-msg', currentRawMsg + msg);

        // Refresh the displayed AI message
        this.refreshAiMsg(true);

        // Scroll slightly so user sees the new content
        this.trigger('scrollTillLastMessageTop');
    }

    /**
     * Handles an error during AI streaming
     * @param {Object} error - Error object or message
     */
    aiStreamMsgError(error) {
        if (!this.aiIsTalking) {
            this.startAITalking();
        }

        // Clear the AI streaming div (if any)
        const $talkingDiv = $('.chat-ai.talking');
        $talkingDiv.attr('data-raw-msg', translations['messages.chatbot.error.response']);

        this.trigger('aiStopTalking');
    }

    /**
     * Show the "thinking" state
     */
    aiStartThinking() {
        this.$thinkingDiv.css('display', 'flex');
    }

    /**
     * Start the AI talking sequence (hidden thinking div, create a new AI streaming div)
     */
    startAITalking() {
        this.$thinkingDiv.hide();
        this.aiIsTalking = true;

        // Insert a new chat-ai block to hold the streamed text
        const aiResponseDiv = $('<div class="chat-text chat-ai talking" data-raw-msg=""></div>');
        this.$thinkingDiv.before(aiResponseDiv);

        // Notify and scroll
        this.trigger('aiStartTalking');
        this.scrollToBottom();
    }

    /**
     * Stop the AI from talking, finalize message display
     */
    aiStopTalking() {
        this.aiIsTalking = false;

        // Make sure thinking div is hided
        this.$thinkingDiv.hide();

        // Refresh the final AI message
        this.refreshAiMsg(false);

        // Stop talking class
        $('.chat-ai.talking').removeClass('talking');
    }

    /**
     * Rerender the "talking" AI message with full formatted HTML
     */
    refreshAiMsg(stillTalking) {
        const $talkingDiv   = $('.chat-ai.talking');
        const completeMsg   = $talkingDiv.attr('data-raw-msg') || '';
        const formattedHtml = messageFormatter.formatMessage(completeMsg);

        var copyDiv = `
            <div class="ai-text-copy">
                <div class="copy_msg">${translations['messages.Copy']}</div>
            </div>
        `;

        if (!stillTalking && AgentTool.getConfigurationValue(this.agent, 'voiceEnable', false)) {
            copyDiv += `
            <div class="ai-audio-tts to-load">
                <div class="audio_tts_ready"></div>
            </div>
            `;
        }

        // Replace the content with the newly formatted message
        $talkingDiv.html(`
            <div class="realMsg">${formattedHtml}</div>
            ${copyDiv}
        `);
    }

    /**
     * Clears the chat of all messages (except the .thinking div)
     */
    clearMessages() {
        // Remove existing messages
        this.$mainChatDiv.find('.chat-text').not('.thinking').remove();

        // Show "new conversation" info for the current agent
        let imageHtml = '';
        if (this.agent && this.agent.image) {
            imageHtml = `<div class="image"><img src="${this.agent.image}" /></div>`;
        }

        const name        = this.agent?.name || '';
        const description = this.agent?.description || '';

        const infosDiv = `
            ${imageHtml}
            <div class="name">${name}</div>
            <div class="description">${description}</div>
        `;
        $('#new_conversation_infos').html(infosDiv);
    }

    /**
     * Scroll to the bottom of the chat
     */
    scrollToBottom() {
        this.trigger('scrollBottom');
    }

    removePartialAIResponse() {
        console.warn('CHATZONE | Removing partial AI response');

        // Remove any AI message that's currently "talking" (streaming)
        const $talkingDiv = $('.chat-ai.talking');
        if ($talkingDiv.length) {
            $talkingDiv.remove();
        }

        // Reset AI talking state
        this.aiIsTalking = false;

        // Show thinking div again if it was hidden
        this.$thinkingDiv.show();
    }

    removeLastUserMessage() {
        console.warn('CHATZONE | Removing last user message');

        // Find and remove the last user message and any associated file elements
        const $lastUserMessage = this.$mainChatDiv.find('.chat-user').last();
        if ($lastUserMessage.length) {
            // Also check if there's a file element right before the user message
            const $prevElement = $lastUserMessage.prev();
            if ($prevElement.hasClass('file-element')) {
                $prevElement.remove();
            }
            $lastUserMessage.remove();
        }
    }
}

// Initialize the ChatbotChatZone
const chatbotChatZone = new ChatbotChatZone();
