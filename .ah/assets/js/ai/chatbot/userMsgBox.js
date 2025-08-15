class ChatbotUserInput extends BaseClass {
    constructor() {
        super();

        // Cached Elements
        this.$userMsgBox = $('#user-input-wrap');
        this.$userTextareaBox = $('#user-textarea-input');

        // Internal State
        this.isThinking = false;
        this.isStreaming = false;
        this.originalMessage = ''; // Store original message for restoration
        this.enterKeySubmit = true;

        // Event Initialization (only if not guest or if public)
        if (!$('body').hasClass('guest') || $('body').hasClass('public')) {
            this.initEvents();
        }

        // Subscriptions
        this.subscribe('loadAgent', (agent) => this.loadAgent(agent));
        this.subscribe('aiStopTalking', () => this.aiStopTalking());
        this.subscribe('aiStartStreaming', () => this.aiStartStreaming());
        this.subscribe('submitUserMessage', () => this.submitUserMessage());
    }

    initEvents() {
        // Key / Focus / Blur
        $(document).on('keypress', (e) => this.onDocumentKeypress(e));
        this.$userTextareaBox.on('keydown', (e) => this.onTextareaKeydown(e));
        this.$userTextareaBox.on('focus', (e) => this.onTextareaFocus(e));
        this.$userTextareaBox.on('blur', (e) => this.onTextareaBlur(e));
        this.$userTextareaBox.on('paste', (e) => this.handlePaste(e));

        // Window resize event
        $(window).on('resize', this.throttle(() => this.handleResize(), 100));

        // UI interaction events
        $('.user-submit-message').on('click', () => this.handleSubmitButtonClick());
        $('#fullmessage_button').on('click', () => this.openFullScreenMessage());
        $('#up_agent').on('click', () => this.toggleUpAgent());

        // Document click for closing full screen message
        $(document).on('click', (e) => {
            if (!this.$userMsgBox.is(e.target) && this.$userMsgBox.has(e.target).length === 0) {
                this.closeFullScreenMessage();
            }
        });
    }

    loadAgent(agent) {
        let defaultPlaceholder = this.$userTextareaBox.attr('default-placeholder');

        // Handle placeholder based on public/private access
        if ($('body').hasClass('public')) {
            defaultPlaceholder = '';
        }

        // Process placeholder and update UI
        const newPlaceholder = defaultPlaceholder ? defaultPlaceholder.replace('%AGENTNAME%', agent.name) : '';
        this.$userTextareaBox.attr('placeholder', newPlaceholder);
        this.$userMsgBox.find('.agent_name .label').text(agent.name);

        // Clear textarea and reset state
        this.$userTextareaBox.text(this.$userTextareaBox.attr('placeholder')).addClass('placeholder');
        this.aiStopTalking();

        // Configure up agent button visibility
        const showUpAgent = AgentTool.getConfigurationValue(agent, 'up_agent_model', false);
        this.$userMsgBox.find('#up_agent').removeClass('selected')[showUpAgent ? 'show' : 'hide']();
    }

    toggleUpAgent() {
        const $uppButton = $('#up_agent');
        const isSelected = !$uppButton.hasClass('selected');

        $uppButton.toggleClass('selected', isSelected);
        this.trigger('toggleUpAgent', isSelected);
    }

    aiStopTalking() {
        this.isThinking = false;
        this.isStreaming = false;
        this.$userMsgBox.removeClass('thinking streaming');
    }

    aiStartStreaming() {
        this.isStreaming = true;
        this.$userMsgBox.addClass('streaming');
    }

    handleSubmitButtonClick() {
        if (this.isStreaming) {
            this.stopStreaming();
        } else {
            this.submitUserMessage();
        }
    }

    stopStreaming() {
        console.warn('USER | Stopping stream');

        // Cancel the current stream
        ApiCall.cancelCurrentStream();

        // Restore original message to textarea
        if (this.originalMessage) {
            this.$userTextareaBox.html(this.originalMessage);
            
            // Remove placeholder class if present and ensure proper state
            this.$userTextareaBox.removeClass('placeholder');
            
            // Focus the textarea and move cursor to end
            this.focusTextareaAtEnd();
            
            // Clear stored original message
            this.originalMessage = '';
        }

        // Trigger events to clean up UI
        this.trigger('stopStreaming');
        this.trigger('aiStopTalking');

        // Reset all states to allow re-submission
        this.isThinking = false;
        this.isStreaming = false;
        this.$userMsgBox.removeClass('thinking streaming');
        
        // Ensure UI is ready for interaction
        setTimeout(() => {
            // Double-check that all states are properly reset
            if (!this.isThinking && !this.isStreaming) {
                console.info('USER | Submit functionality re-enabled');
            }
        }, 100);
    }

    handleResize() {
        // Can be extended for responsive behavior
    }

    focusTextareaAtEnd() {
        this.$userTextareaBox.focus();

        if (this.$userTextareaBox.hasClass('placeholder') ||
            this.$userTextareaBox.text().trim() === '') {
            return;
        }

        const range = document.createRange();
        const selection = window.getSelection();
        const container = this.$userTextareaBox[0];

        if (container.childNodes.length > 0) {
            const lastNode = container.lastChild;

            if (lastNode.nodeType === 3) { // Text node
                range.setStart(lastNode, lastNode.length);
            } else { // Element node
                range.setStartAfter(lastNode);
            }

            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    onTextareaFocus() {
        this.trigger('closeSidebar');

        if (this.$userTextareaBox.text() === this.$userTextareaBox.attr('placeholder')) {
            this.$userTextareaBox.text('').removeClass('placeholder');
        } else {
            this.moveCursorToEnd();
        }
    }

    onTextareaBlur() {
        if (this.$userTextareaBox.text().trim() === '') {
            this.$userTextareaBox
                .text(this.$userTextareaBox.attr('placeholder'))
                .addClass('placeholder');
        }
    }

    moveCursorToEnd() {
        const el = this.$userTextareaBox[0];
        const range = document.createRange();
        const selection = window.getSelection();

        if (el.childNodes.length > 0) {
            const lastNode = el.lastChild;

            if (lastNode.nodeType === 3) { // Text node
                range.setStart(lastNode, lastNode.length);
            } else { // Element node
                range.setStartAfter(lastNode);
            }

            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    scrollToCursor() {
        setTimeout(() => {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            if (!rect || rect.height <= 0) {
                // Fallback: scroll to bottom
                const container = this.getScrollContainer();
                container.scrollTop = container.scrollHeight;
                return;
            }

            const container = this.getScrollContainer();
            const containerRect = container.getBoundingClientRect();

            // Check if cursor is outside visible area
            if (rect.top < containerRect.top || rect.bottom > containerRect.bottom) {
                const scrollTop = rect.top + container.scrollTop - containerRect.top;
                const offset = (containerRect.height / 2) - (rect.height / 2);
                container.scrollTo({
                    top: scrollTop - offset,
                    behavior: 'smooth'
                });
            }
        }, 50);
    }

    getScrollContainer() {
        const textarea = this.$userTextareaBox[0];

        if (textarea && textarea.scrollHeight > textarea.clientHeight) {
            return textarea;
        }

        const msgBox = this.$userMsgBox[0];
        if (msgBox && msgBox.scrollHeight > msgBox.clientHeight) {
            return msgBox;
        }

        const parentContainer = this.$userTextareaBox.closest('.scrollable-container, .user-input-wrap, .message-container');
        if (parentContainer.length) {
            return parentContainer[0];
        }

        return document.body;
    }

    handlePaste(e) {
        e.preventDefault();

        const clipboardData = (e.originalEvent || e).clipboardData || window.clipboardData;
        let content = '';
        let isHtml = false;

        if (clipboardData) {
            if (clipboardData.types.includes('text/plain')) {
                content = clipboardData.getData('text/plain');
            } else if (clipboardData.types.includes('text/html')) {
                content = clipboardData.getData('text/html');
                isHtml = true;
            }
        }

        if (!content) {
            console.warn('No content in clipboard');
            return;
        }

        // Remove placeholder if present
        if (this.$userTextareaBox.hasClass('placeholder')) {
            this.$userTextareaBox.empty().removeClass('placeholder');
        }

        // Clean and process the content
        const cleanedContent = this.cleanPastedContent(content, isHtml);

        // Insert content with progress indicator for large pastes
        if (content.length > 10000) {
            const $indicator = $('<span class="paste-indicator">Processing paste...</span>');
            this.$userTextareaBox.append($indicator);

            setTimeout(() => {
                $indicator.remove();
                this.insertCleanTextAtCursor(cleanedContent);
                this.scrollToCursor();
            }, 10);
        } else {
            this.insertCleanTextAtCursor(cleanedContent);
            this.scrollToCursor();
        }
    }

    insertCleanTextAtCursor(content) {
        document.execCommand('insertHTML', false, content);

        // Remove fragment comments
        const commentNodes = [];
        const treeWalker = document.createTreeWalker(
            this.$userTextareaBox[0],
            NodeFilter.SHOW_COMMENT,
            null,
            false
        );

        let currentNode;
        while (currentNode = treeWalker.nextNode()) {
            if (currentNode.nodeValue.includes('Fragment')) {
                commentNodes.push(currentNode);
            }
        }

        commentNodes.forEach(node => node.parentNode.removeChild(node));
    }

    cleanPastedContent(content, isHtml) {
        // Handle plain text
        if (!isHtml) {
            return content
                .split(/\r\n|\r|\n/)
                .map((line) => {
                    const indentMatch = line.match(/^(\s*)/);
                    const indent = indentMatch ? indentMatch[0].replace(/ /g, '&nbsp;') : '';
                    const escapedLine = messageFormatter.escapeHtml(line.trim());
                    return escapedLine ? `${indent}${escapedLine}<br/>` : '<br/>';
                })
                .join('');
        }

        // Handle HTML content
        const temp = document.createElement('div');
        temp.innerHTML = content;

        // Remove comment nodes
        const commentNodes = [];
        const treeWalker = document.createTreeWalker(
            temp,
            NodeFilter.SHOW_COMMENT,
            null,
            false
        );

        let currentNode;
        while (currentNode = treeWalker.nextNode()) {
            commentNodes.push(currentNode);
        }
        commentNodes.forEach(node => node.parentNode.removeChild(node));

        // Process the HTML structure
        this.processNodeAndPreserveStructure(temp);
        return temp.innerHTML;
    }

    processNodeAndPreserveStructure(container) {
        // Remove all styles and classes
        const allElements = container.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
            allElements[i].removeAttribute('style');
            allElements[i].removeAttribute('class');
        }

        // Define allowed and unwanted tags
        const allowedTags = [
            'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'a', 'strong', 'em',
            'code', 'pre', 'br', 'div', 'span'
        ];

        const unwantedTags = [
            'script', 'style', 'button', 'svg', 'img',
            'input', 'textarea', 'select', 'form',
            'header', 'footer'
        ];

        // Process all nodes
        const processNode = (node) => {
            if (!node || node.nodeType === 3) return;

            // Remove unwanted elements
            if (unwantedTags.includes(node.tagName?.toLowerCase())) {
                node.parentNode?.removeChild(node);
                return;
            }

            // Process children first
            Array.from(node.childNodes).forEach(processNode);

            // Convert non-allowed elements
            if (node.nodeType === 1 && !allowedTags.includes(node.tagName.toLowerCase())) {
                const isBlockElement = getComputedStyle(node).display === 'block';
                const wrapper = isBlockElement ? document.createElement('div') : document.createElement('span');

                while (node.firstChild) {
                    wrapper.appendChild(node.firstChild);
                }

                node.parentNode.insertBefore(wrapper, node);
                node.parentNode.removeChild(node);
            }
        };

        Array.from(container.childNodes).forEach(processNode);
    }

    onTextareaKeydown(e) {
        // Handle Enter key submission
        if (e.key === 'Enter') {
            if (this.enterKeySubmit && !e.shiftKey) {
                e.preventDefault();
                this.submitUserMessage();
                return;
            }
        }

        // Let paste/undo events be handled by the browser
        if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'z')) {
            if (e.key === 'v' && this.$userTextareaBox.is(':focus')) {
                setTimeout(() => this.scrollToCursor(), 10);
            }
            return;
        }

        // Skip if placeholder is showing or if it's a special key
        if (this.$userTextareaBox.hasClass('placeholder') ||
            e.key.length > 1 ||
            e.ctrlKey || e.altKey || e.metaKey) {
            return;
        }

        // Better handling for character insertion
        e.preventDefault();
        document.execCommand('insertText', false, e.key);
        this.scrollToCursor();
    }

    onDocumentKeypress(e) {
        // Skip focusing if command/control key is pressed
        if (e.metaKey || e.ctrlKey) {
            return;
        }

        // Auto-focus textarea when typing if not in a popup
        if (!$('body').hasClass('popup-open') && !this.$userTextareaBox.is(':focus')) {
            this.$userTextareaBox.focus();
        }
    }

    removeBase64Images(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        tempDiv.querySelectorAll('img').forEach((img) => {
            if (img.src.startsWith('data:image')) {
                img.remove();
            }
        });

        return tempDiv.innerHTML;
    }

    async submitUserMessage() {
        // Close fullscreen and prevent double submission
        this.closeFullScreenMessage();
        if (this.isThinking) return;

        // Get files and message content
        const files = typeof chatbotFileInput !== 'undefined'
            ? chatbotFileInput.getFileList()
            : [];

        const rawMessage = this.$userTextareaBox.hasClass('placeholder')
            ? ''
            : this.$userTextareaBox.html().trim();

        // Only proceed if there is content to send
        if (!rawMessage && files.length === 0) return;

        // Store original message for potential restoration
        this.originalMessage = rawMessage;

        // Update UI state
        $('body')
            .removeClass('page-new-discussion')
            .addClass('page-discussion');

        this.isThinking = true;
        this.trigger('aiStartThinking');
        this.$userMsgBox.addClass('thinking');

        // Convert HTML to Markdown
        const turndownService = new TurndownService();
        let markdown = turndownService.turndown(rawMessage);
        const properMessage = markdown
            .replace(/\n{2,}/g, '\n')
            .replace(/\\\\/g, '\\');

        // Trigger message submission event
        this.trigger('userMessageSubmit', {
            msg: properMessage,
            files
        });

        // Clear the textarea
        this.$userTextareaBox.html('');

        // Handle file processing if available
        if (typeof chatbotFileInput !== 'undefined') {
            const processedFiles = await chatbotFileInput.processFiles(properMessage);

            if (processedFiles && processedFiles.error) {
                this.trigger('aiStopTalking');
                this.$userTextareaBox.html(rawMessage);
                // Cleanup UI for failed send
                $('#main-chat .thinking').prev().remove();
                $('#main-chat .thinking').prev().remove();
                return;
            }

            this.trigger('processUserMsg', {
                msg: properMessage,
                files: processedFiles
            });
        } else {
            this.trigger('processUserMsg', {
                msg: properMessage,
                files: []
            });
        }
    }

    openFullScreenMessage() {
        if (this.enterKeySubmit) {
            this.enterKeySubmit = false;
            this.$userMsgBox.addClass('full-message-popup');
        } else {
            this.closeFullScreenMessage();
        }
    }

    closeFullScreenMessage() {
        this.enterKeySubmit = true;
        this.$userMsgBox.removeClass('full-message-popup');
    }
}

// Autoload
const chatbotUserInput = new ChatbotUserInput();
