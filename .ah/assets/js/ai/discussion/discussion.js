class ChatbotDiscussion extends BaseClass {
    constructor() {
        super();

        this.agent = null;

        this.discussion = null;
        this.maxDiscussionSize = 8; // Number of messages to send back to the agent to keep context

        // Subscribe to events
        this.subscribe('loadAgent', (agent) => this.loadAgent(agent));
        this.subscribe('loadDiscussion', (discussion) => this.loadDiscussion(discussion));
        this.subscribe('newDiscussion', (agent) => this.newDiscussion(agent));
        this.subscribe('toggleFavorite', () => this.toggleFavorite());
    }

    getDiscussionKey() {
        return this.discussion ? this.discussion.key : null;
    }
    setDiscussionKey(key) {
        return this.discussion.key = key;
    }

    /**
     * Determines whether the favorite icon should be shown.
     * Returns true only for valid, existing discussions.
     */
    shouldShowFavoriteIcon() {
        return this.discussion &&
               this.discussion.key &&
               this.discussion.title !== translations['messages.chatbot.discussion.new'];
    }

    /**
     * Updates the UI to reflect the current favorite status
     */
    updateFavoriteUI() {
        // Check if we should show the heart icon
        if (!this.shouldShowFavoriteIcon()) {
            $('.favorite-icon').hide();
            return;
        }

        // Show the icon and set appropriate state for valid discussions
        $('.favorite-icon').show();
        if (this.discussion.favorite) {
            $('.favorite-icon').addClass('active').html('&#10084;');
        } else {
            $('.favorite-icon').removeClass('active').html('&#9825;');
        }
    }

    /**
     * Starts a new discussion for the given agent.
     */
    newDiscussion(agent) {
        this.agent = agent;
        this.discussion = {
            key    : null,
            title  : translations['messages.chatbot.discussion.new'],
            content: []
        };

        // Manage URL and title for public agents
        let agentUrl = `/agent/${agent.code}`;
        if (agent.isPublic && $('body').hasClass('public')) {
            agentUrl = `/public/agent/${agent.code}`;
            this.discussion.title = agent.name;
        }

        // Trigger URL & title change
        this.trigger('updateUrlTitle', {
            h1   : this.discussion.title,
            title: `${this.discussion.title} - Discussion`,
            page : `agent-${agent.code}`,
            url  : agentUrl
        });

        // Hide favorite icon for new discussions
        $('.favorite-icon').hide();
    }

    /**
     * Loads an existing discussion by key.
     */
    async loadDiscussion(discussion) {
        this.trigger('loading');
        try {
            const loadedDiscussion = await discussionManager.getDiscussionByKey(discussion.key);
            const discussionData = loadedDiscussion.response;
            // Parse the content (assumed to be stored as a JSON string)
            discussionData.content = JSON.parse(discussionData.content);
            this.discussion = discussionData;

            // Update URL & title based on the loaded discussion
            this.trigger('updateUrlTitle', {
                h1: this.discussion.title,
                title: `${this.discussion.title} - Discussion`,
                page: `discussion-${this.discussion.key}`,
                url: `/discussion/${this.discussion.key}`
            });

            // Update favorite status in UI - only show for real discussions with content
            this.updateFavoriteUI();

            this.trigger('discussionLoaded', this.discussion);
        } catch (error) {
            console.error("Error loading discussion:", error);
            this.trigger('discussionLoadError', error);
        } finally {
            this.trigger('finishLoading');
        }
    }

    /**
     * Toggles the favorite status of the current discussion
     */
    async toggleFavorite() {
        if (!this.discussion || !this.discussion.key) {
            return;
        }

        try {
            const response = await discussionManager.toggleFavorite(this.discussion.key);

            if (response && response.response) {
                this.discussion.favorite = response.response.isFavorite;
                this.updateFavoriteUI();

                // Update the discussion in the list
                this.trigger('updateDiscussionFavorite', {
                    key: this.discussion.key,
                    favorite: this.discussion.favorite
                });
            }
        } catch (error) {
            console.error("Error toggling favorite status:", error);
        }
    }

    /**
     * Sets the current agent.
     */
    loadAgent(agent) {
        this.agent = agent;
    }

    /**
     * Adds a user message to the discussion.
     */
    addUserMessage(msg, files = []) {
        // For user messages, we only add them locally.
        this.addMessage('user', msg, files);
    }

    /**
     * Adds an assistant (AI) message to the discussion and sends it to the server.
     */
    addAIMessage(msg, files = []) {
        // Only call addMessage to avoid duplicate insertion.
        this.addMessage('assistant', msg, files);
    }

    /**
     * Returns the last exchange (the last two messages) from the discussion.
     * @returns {Array}
     */
    lastExchange() {
        const content = this.discussion.content;
        return content.length >= 2 ? content.slice(-2) : content;
    }

    /**
     * Removes the last exchange (incomplete conversation) from the discussion.
     * This is used when streaming is cancelled.
     */
    removeLastExchange() {
        console.warn('DISCUSSION | Removing last exchange');
        
        // Remove the last user message if it exists
        if (this.discussion.content.length > 0) {
            const lastMessage = this.discussion.content[this.discussion.content.length - 1];
            if (lastMessage.role === 'user') {
                this.discussion.content.pop();
                console.warn('DISCUSSION | Removed last user message');
            }
        }
        
        // If there's also an assistant message being streamed, it would be removed by the UI cleanup
        // but we don't add it to the discussion content until streaming is complete
    }

    /**
     * Adds a message to the discussion and, if it's from the assistant,
     * sends it to the server.
     */
    async addMessage(role, msg, files = [])
    {
        // Add message locally.
        this.discussion.content.push({ role, msg, files });

        // For assistant messages, make the API call.
        if (role === 'assistant') {
            const data = {
                discussionKey: this.getDiscussionKey(),
                agentCode: this.agent.code,
                messages: this.lastExchange()
            };

            try {
                const response = await ApiCall.call('POST', '/api/v1/discussion/add-message', data);

                // Check if the status is 200 (as a number)
                if (Number(response.status) !== 200) {
                    console.error("Failed to add message:", response);
                    return;
                }

                const isNewDiscussion = response.response.title == 'New discussion';

                // For a new discussion (unless in a public context), update its title on the server.
                if (isNewDiscussion && !(this.agent.isPublic && $('body').hasClass('public'))) {
                    ApiCall.call(
                        'POST',
                        '/api/v1/discussion/update-title',
                        { discussionKey: this.getDiscussionKey() },
                        this.handleDiscussionTitleReturn.bind(this)
                    );
                }
            } catch (error) {
                console.error("Error adding assistant message:", error);
            }
        }
    }

    /**
     * Handles the server response after updating the discussion title.
     */
    handleDiscussionTitleReturn(response) {
        if (response && response.discussion) {
            const discussion = response.discussion;
            discussion.new = true;
            this.trigger('addDiscussion', discussion);

            // Update the local discussion with the new title
            this.discussion.title = discussion.title;

            this.trigger('updateUrlTitle', {
                h1: discussion.title,
                title: `${discussion.title} - Discussion`,
                page: `discussion-${discussion.key}`,
                url: `/discussion/${discussion.key}`
            });

            // Show the favorite icon now that we have a proper title
            this.updateFavoriteUI();
        } else {
            console.error("Invalid response in handleDiscussionTitleReturn:", response);
        }
    }

    /**
     * Returns a trimmed version of the discussion content,
     * preserving the first message and the last (maxDiscussionSize - 1) messages.
     */
    getTrimmedDiscussion() {
        const content = this.discussion.content;
        if (content.length > this.maxDiscussionSize) {
            return [
                content[0],
                ...content.slice(-this.maxDiscussionSize + 1)
            ];
        }
        return content;
    }

    /**
     * Counts the number of words in a given message.
     */
    countWords(msg) {
        return msg.trim().split(/\s+/).length;
    }

    /**
     * Truncates a message if it exceeds a specified number of words,
     * keeping a certain number of words at the start and end.
     */
    truncateMessage(msg, maxWords, keepStart, keepEnd) {
        const words = msg.trim().split(/\s+/);
        if (words.length <= maxWords) return msg;
        const start = words.slice(0, keepStart).join(' ');
        const end = words.slice(-keepEnd).join(' ');
        return `${start} [...] ${end}`;
    }

    /**
     * Converts the discussion history into a formatted string.
     * This may be used for sending context to the agent.
     */
    getDiscussionAsString() {
        if (!this.discussion.content.length) return '';

        const trimmedDiscussion = this.getTrimmedDiscussion();
        const discussionLength = trimmedDiscussion.length;

        const discussionString = trimmedDiscussion.map((entry, index) => {
            let { msg, role, files } = entry;
            let fileContent = '';

            if (files && files.length > 0) {
                fileContent = files.map(file =>
                    `\nFile Name: ${file.originalFilename}\nContent: ${file.content}`
                ).join('\n\n');
                fileContent = '## Attached File(s) Content' + fileContent + '\n## Message\n';
            }

            // Apply truncation for older messages to keep context concise.
            if (index < discussionLength - 2) {
                if (index < discussionLength - 6) {
                    msg = this.truncateMessage(msg, 100, 50, 50);
                    fileContent = this.truncateMessage(fileContent, 100, 50, 50);
                } else if (index < discussionLength - 4) {
                    msg = this.truncateMessage(msg, 200, 120, 80);
                    fileContent = this.truncateMessage(fileContent, 200, 120, 80);
                } else {
                    msg = this.truncateMessage(msg, 350, 250, 100);
                    fileContent = this.truncateMessage(fileContent, 350, 250, 100);
                }
            }

            return `**${role} msg**\n${fileContent}${msg}\n-------`;
        }).join('\n\n');

        return `# History of the on-going conversation\n${discussionString}`;
    }
}

window.ChatbotDiscussion = ChatbotDiscussion;
