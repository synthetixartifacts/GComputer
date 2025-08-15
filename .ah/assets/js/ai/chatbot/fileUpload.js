const FILE_DEFAULT_MAX_SIZE           = 5;
const FILE_DEFAULT_FILE_OR_TEXT       = "both";
const FILE_DEFAULT_ALLOWED_EXTENSIONS = [
    'png', 'jpg', 'jpeg',
    'pdf', 'txt', 'doc', 'docx', 'pptx',
    'mp3', 'wav', 'mpeg', 'webm'
];


class ChatbotFileInput extends BaseClass {
    constructor() {
        super();

        // Cached Elements
        this.$userMsgBox   = $('#user-input-wrap');
        this.$fileDropZone = $('#drop-zone');
        this.$fileInput    = $('#file-input');
        this.$fileListDiv  = $('#file-list');
        this.$fileButton   = $('#file_button');

        // Data
        this.fileList              = [];
        this.fileMaxSize           = FILE_DEFAULT_MAX_SIZE;
        this.fileOrText            = FILE_DEFAULT_FILE_OR_TEXT;
        this.fileAllowedExtensions = FILE_DEFAULT_ALLOWED_EXTENSIONS;

        // Only init events if not public
        if (!$('body').hasClass('public')) {
            this.initEvents();
        }

        // Listen for agent loading
        this.subscribe('loadAgent', (agent) => this.loadAgent(agent));
    }

    /**
     * Initialize event listeners
     */
    initEvents() {
        // ============== Drag & Drop ==============
        const handleDragOver = (e) => {
            e.preventDefault();
            this.$userMsgBox.addClass('dragover');
        };

        this.$fileDropZone.on('dragover', handleDragOver);
        this.$userMsgBox.on('dragover', handleDragOver);

        this.$fileDropZone.on('dragleave', () => {
            this.$userMsgBox.removeClass('dragover');
        });

        // Prevent default drop on userMsgBox
        this.$userMsgBox.on('drop', (e) => e.preventDefault());

        // Handle actual drop on drop-zone
        this.$fileDropZone.on('drop', (e) => {
            e.preventDefault();
            this.$userMsgBox.removeClass('dragover');
            this.handleFiles(e.originalEvent.dataTransfer.files);
        });

        // ============== Click to select file ==============
        this.$fileButton.on('click', () => {
            this.$fileInput.trigger('click');
        });

        // ============== Handle file input change ==============
        this.$fileInput.on('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // ============== Handle clipboard paste ==============
        $(document).on('paste', (e) => {
            this.handleClipboardPaste(e.originalEvent);
        });
    }

    /**
     * Handle clipboard paste events for images
     * @param {ClipboardEvent} e
     */
    handleClipboardPaste(e) {
        if (!e.clipboardData || !e.clipboardData.items) {
            return;
        }

        const items = e.clipboardData.items;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();

                if (blob) {
                    // Create a File object from the blob
                    const timestamp = new Date().getTime();
                    const fileName = `pasted_image_${timestamp}.png`;

                    // Create a new File with proper name
                    const file = new File([blob], fileName, { type: 'image/png' });

                    // Process the file through existing handler
                    this.handleFiles([file]);
                }
            }
        }
    }

    /**
     * Called when agent data is loaded.
     * @param {object} agent
     */
    loadAgent(agent) {
        // Max File Size
        const max = AgentTool.getConfigurationValue(agent, 'fileMaxSize', FILE_DEFAULT_MAX_SIZE);
        this.fileMaxSize = parseInt(max, 10) * 1024 * 1024; // Convert ot Mb

        // File Or Text (can be file, text, both, oneOf)
        this.fileOrText = AgentTool.getConfigurationValue(agent, 'fileOrText', FILE_DEFAULT_FILE_OR_TEXT);

        // Allowed Extensions
        this.fileAllowedExtensions = AgentTool.getConfigurationValue(agent, 'fileAllowedExtensions', FILE_DEFAULT_ALLOWED_EXTENSIONS);

        $('#drop-zone .drop-info').html(
            translations['messages.chatbot.file.maxSize'].replace('%MAX%', max)
        );

        this.emptyFileList();
    }

    /**
     * Clears internal file list and UI
     */
    emptyFileList() {
        this.fileList = [];
        this.$fileInput.val('');
        this.$fileListDiv.empty();
    }

    /**
     * Removes file from the file list
     */
    removeFileFromList(fileName) {
        this.fileList = this.fileList.filter((f) => f.name !== fileName);

        // Update UI
        this.$fileListDiv.find(`.delete-file[data-filename="${fileName}"]`)
            .closest('.file-item')
            .remove();

        // Rebuild DataTransfer to reflect the new file list
        const dataTransfer = new DataTransfer();
        this.fileList.forEach((file) => dataTransfer.items.add(file));
        this.$fileInput[0].files = dataTransfer.files;

        // If no files remain, reset input
        if (this.fileList.length === 0) {
            this.$fileInput.val('');
        }
    }

    /**
     * Returns all files in the queue
     */
    getFileList() {
        return this.fileList;
    }

    /**
     * Returns the total size (in bytes) of the files in fileList
     */
    getTotalFileSize() {
        return this.fileList.reduce((acc, file) => acc + file.size, 0);
    }

    /**
     * Main method to handle newly added files (drag & drop or via file input)
     */
    handleFiles(files) {
        Array.from(files).forEach((file) => {
            const { name, size } = file;
            const fileExtension = this.getFileExtension(name);

            // Check if extension is allowed
            if (!this.fileAllowedExtensions.includes(fileExtension)) {
                this.displayError(`File format "${fileExtension}" not supported. Allowed: [${this.fileAllowedExtensions.join(', ')}].`);
                return;
            }

            // Check if file with same name already exists
            if (this.fileList.some((f) => f.name === name)) {
                this.displayError(`File "${name}" is already added.`);
                return;
            }

            // Check overall total size limit
            const newTotalSize = this.getTotalFileSize() + size;
            if (newTotalSize > this.fileMaxSize) {
                this.displayError(
                    `Cannot add "${name}". Total file size exceeds the maximum of ${this.formatBytes(this.fileMaxSize)}.`
                );
                return;
            }

            // Pass all checks: add to list and display
            file.originalName = name;
            this.fileList.push(file);
            this.displayFile(file);
        });
    }

    /**
     * Helper to extract file extension
     */
    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    /**
     * Displays an error in the UI (auto-remove after a timeout)
     */
    displayError(message) {
        const $fileElement = $('<div>', { class: 'error', html: message });
        this.$fileListDiv.append($fileElement);
        setTimeout(() => {
            $fileElement.remove();
        }, 3000);
    }

    /**
     * Adds a file to the UI
     */
    displayFile(file) {
        // Create file renderer if not exists

        // Get jQuery object directly from renderer
        const $fileElement = fileRenderer.renderFileItem(file, {
            showDelete: true,
            showPreview: true,
            onDeleteClick: (fileName) => this.removeFileFromList(fileName)
        });

        // Append the jQuery object directly
        this.$fileListDiv.append($fileElement);
    }

    /**
     * Helper to format bytes to a human-readable size
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k     = 1024;
        const dm    = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i     = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Process all files in the list (example of uploading them)
     */
    async processFiles(userMsg) {
        // Clear UI before processing
        this.$fileListDiv.html('');

        const files = [];

        for (let i = 0; i < this.fileList.length; i++) {
            const file = this.fileList[i];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userMsg', userMsg);

            try {
                const response = await ApiCall.call('POST', '/api/v1/file/upload', formData);

                if (response.status !== 200) {
                    this.displayError(`Error uploading "${file.name}" | ${response.message}`);
                    this.fileList = [];
                    return { error: true, msg: response.message };
                }

                if (response && response.file && response.file.id) {
                    files.push(response.file);
                }
            } catch (error) {
                console.error('Error uploading file:', error);
                this.displayError(`Error uploading "${file.name}": ${error.message}`);
            }
        }

        // Reset fileList after processing
        this.fileList = [];
        return files;
    }
}

// Autoload
const chatbotFileInput = new ChatbotFileInput();
window.chatbotFileInput = chatbotFileInput;
