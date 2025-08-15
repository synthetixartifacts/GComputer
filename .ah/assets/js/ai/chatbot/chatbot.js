/**
 * Main Chatbot class orchestrating conversation flow
 */
class Chatbot extends BaseClass {
    constructor() {
        super();

        // Cached elements
        this.$chatzone    = $('#chatzone');
        this.$mainChatDiv = $('#main-chat');

        // Agent & conversation state
        this.agent          = null;
        this.conversationId = null;
        this.data           = [];

        // Instances / Utilities
        this.discussion       = new ChatbotDiscussion();

        // Subscriptions
        this.subscribe('loadAgent',       (agent) => this.loadAgent(agent));
        this.subscribe('processUserMsg',  (info)  => this.processUserMsg(info));
        this.subscribe('unloadChatBot',   ()      => this.unloadChatBot());
        this.subscribe('toggleUpAgent',   (isItUp)=> this.toggleUpAgent(isItUp));
        this.subscribe('stopStreaming',   ()      => this.handleStreamStop());

        // DOM events
        this.initEvents();
    }

    /**
     * Set up event handlers on DOM elements
     */
    initEvents() {
        $('#current_agent .refresh').on('click', () => {
            if (this.agent) {
                this.trigger('newConversationWithAgent', this.agent.code);
            }
        });
    }

    /**
     * Unload or hide the chatbot UI
     */
    unloadChatBot() {
        this.$chatzone.hide();
        $('#user-input-wrap').hide();
        $('#current_agent').hide();
    }

    /**
     * Prepare for a new agent session (show UI, reset chat, etc.)
     * @param {Object} agent - Agent data
     */
    loadAgent(agent) {
        // Reset conversation state
        this.conversationId = null;
        this.agent          = agent;
        this.data           = []; // Reset data

        // Show refresh button
        $('#current_agent').hide().show(100);

        // Clear any old messages
        this.trigger('clearMessages');

        // Default message from the agent
        if (this.agent.defaultMessage && this.agent.defaultMessage !== '') {
            this.trigger('addAIMessageToDOM', this.agent.defaultMessage);
        }

        // Show chatbot container
        this.$chatzone.show();

        // Show user input area
        $('#user-input-wrap').show();
    }

    toggleUpAgent(isItUp = false) {
        if (isItUp) {
            this.data['up_agent_model'] = AgentTool.getConfigurationValue(this.agent, 'up_agent_model', false);
        } else {
            delete this.data['up_agent_model'];
        }
    }

    handleStreamStop() {
        console.warn('CHATBOT | Handling stream stop');
        
        // Reset conversation ID to stop any ongoing processing
        this.conversationId = null;
        
        // Remove the partial AI response from UI
        this.trigger('removePartialAIResponse');
        
        // Remove the user message that was just added (it will be restored to textarea)
        this.trigger('removeLastUserMessage');
        
        // Revert the discussion state to before this exchange
        this.discussion.removeLastExchange();
    }

    processUserMsg(info, auto_callback = false) {
        // For tracking which conversation ID is active
        this.conversationId = Date.now();

        // If agent uses memory, gather the discussion context
        let discussionText = info.msg;
        if (AgentTool.getConfigurationValue(this.agent, 'useMemory', false)) {
            const discussionHistory = this.discussion.getDiscussionAsString();

            if (discussionHistory && discussionText) {
                discussionText = `${discussionHistory} \n\n# NEW user message you have to answer: \n ${discussionText}`;
            } else if (discussionHistory && !discussionText) {
                discussionText = discussionHistory;
            } else if (!discussionHistory && discussionText) {
                discussionText = `\n# Start of this conversation - User message: \n ${discussionText}`;
            } else {
                discussionText = '';
            }

        }

        // Store user message in local discussion state
        this.discussion.addUserMessage(messageFormatter.cleanMessage(info.msg), info.files);

        // Collect file IDs for the API
        const fileIds = (info.files || []).map((file) => file.id);

        // Debug or info logging
        console.warn(`IMPORTANT | Message AI ${this.agent.code} |`, discussionText);

        if (auto_callback) {
            return;
        }

        // Trigger streaming start event
        this.trigger('aiStartStreaming');

        // Start the asynchronous call to the AI
        AgentTool.talk(
            this.agent,
            discussionText,
            this.discussion.getDiscussionKey(),
            fileIds,
            this.data,
            /* stream */ true,
            /* callback */ this.handleAIResponse.bind(this)
        );

    }

    /**
     * TODO - Should this be triggered instead of called to be catchable by multiple listeners?
     * Handle AI response chunks or completion
     * @param {Object|String} chunk - The response chunk (or 'DONE') from the AI
     */
    handleAIResponse(chunk) {
        // If conversation is already reset/changed, stop
        // For if streaming continu responding while process is stop
        if (this.conversationId === null) {
            this.trigger('aiStopTalking');
            return;
        }

        // Handle stream cancellation
        if (chunk === 'CANCELLED') {
            console.warn('CHATBOT | Stream was cancelled');
            this.trigger('aiStopTalking');
            return;
        }

        // Handle stream error completion
        if (chunk === 'DONE-ERROR') {
            console.warn('CHATBOT | Stream completed with error');
            this.trigger('aiStopTalking');
            return;
        }

        // If AI is done sending text chunks
        if (chunk === 'DONE') {
            // Get the latest AI message from DOM
            const $lastAiMessage = this.$mainChatDiv
                .find('.chat-text.chat-ai')
                .not('.thinking')
                .last();

            const completeAiMsg = $lastAiMessage.attr('data-raw-msg');

            if (completeAiMsg && completeAiMsg !== '') {
                // Save final AI message in the local discussion
                this.discussion.addAIMessage(
                    messageFormatter.cleanMessage(completeAiMsg)
                );
            } else {
                // AI provided no textual response
                this.trigger(
                    'aiStreamMsgReturned',
                    translations['messages.chatbot.error.response']
                );
            }

            this.trigger('aiStopTalking');
            this.trigger('aiEndTalking');

            // Auto retrigger?
            // if (completeAiMsg && completeAiMsg.includes('<auto_callback>')) {
            //     this.processUserMsg({ msg: '' }, true);
            // }

            return;
        }

        // If there's an error from the AI
        if (chunk.status !== 200) {
            this.trigger('aiStreamMsgError', chunk);
            return;
        }

        // Setup discussion key
        if (chunk.call && chunk.call.discussion && chunk.call.discussion.key) {
            this.discussion.setDiscussionKey(chunk.call.discussion.key);
        }

        // Otherwise, AI is still streaming text
        const textToAdd = chunk.call?.responseText;
        if (textToAdd) {
            console.info('STREAM | Chunk Received | ', textToAdd);
            this.trigger('aiStreamMsgReturned', textToAdd);
        } else {
            // Possibly no text in the chunk; attempt to parse the full response
            try {
                const response = JSON.parse(chunk.call.response);
                console.info('STREAM | Chunk Received but Empty Text | ', response);
            } catch (parseError) {
                // If parse fails, might be an unexpected response
                console.warn('STREAM | Unexpected response format', parseError);
            }
        }
    }
}

// Autoload
const chatbot = new Chatbot();
