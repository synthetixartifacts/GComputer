class FileRenderer {
    constructor() {
        this.audioEndHandler = this.handleAudioEnd.bind(this);
    }

    renderFileItem(file, options = {}) {
        const name             = file.originalFilename || file.name || 'unknown';
        const fileExtension    = name.split('.').pop().toLowerCase();
        const baseName         = name.replace(`.${fileExtension}`, '');
        const truncatedName    = this.truncateString(baseName, 40);
        const fileUrl          = this.getFileUrl(file);
        const showDeleteButton = options.showDelete === true;

        // Create main container
        const $fileItem = $('<div>', { class: `file-item file-type-${fileExtension}` });

        // Add preview if it's an image
        if (this.isImageFile(fileExtension) && options.showPreview !== false && fileUrl) {
            const $preview = $('<div>', { class: 'file-preview' });
            const $previewLink = $('<a>', { 
                href: fileUrl, 
                target: '_blank', 
                title: `Open ${name} in new tab` 
            });
            $previewLink.append($('<img>', { src: fileUrl, alt: truncatedName }));
            $preview.append($previewLink);
            $fileItem.append($preview);
        }
        // Add audio controls
        else if (this.isAudioFile(fileExtension) && options.showPreview !== false && fileUrl) {
            const $audioControls = $('<div>', { class: 'audio-controls' });
            const $playButton = $('<div>', {
                class: 'play-audio',
                'data-filename': name
            });
            const $audio = $('<audio>', {
                class: 'audio-player',
                src: fileUrl
            });

            $playButton.on('click', (e) => {
                const $audio = $(e.currentTarget).siblings('.audio-player')[0];
                if ($audio.paused) {
                    $audio.play();
                    $(e.currentTarget).addClass('playing');
                } else {
                    $audio.pause();
                    $audio.currentTime = 0;
                    $(e.currentTarget).removeClass('playing');
                }
            });

            $audio.on('ended', this.audioEndHandler);

            $audioControls.append($playButton, $audio);
            $fileItem.append($audioControls);
        }

        // Add filename and extension with clickable link
        const $fileName = $('<div>', {
            class: 'file-name',
            title: baseName
        });
        
        if (fileUrl) {
            const $fileLink = $('<a>', { 
                href: fileUrl, 
                target: '_blank', 
                text: truncatedName,
                title: `Open ${name} in new tab`
            });
            $fileName.append($fileLink);
        } else {
            $fileName.text(truncatedName);
        }
        
        $fileItem.append(
            $fileName,
            $('<div>', {
                class: `file-icon ${fileExtension}`,
                text: fileExtension
            })
        );

        // Add delete button if needed
        if (showDeleteButton) {
            const $deleteButton = $('<button>', {
                class: 'delete-file',
                'data-filename': name,
                text: 'x'
            });

            $deleteButton.on('click', (e) => {
                const fileName = $(e.target).data('filename');
                if (options.onDeleteClick) {
                    options.onDeleteClick(fileName);
                }
            });

            $fileItem.append($deleteButton);
        }

        return $fileItem;
    }

    handleAudioEnd(e) {
        const $audio = $(e.target);
        const $button = $audio.siblings('.play-audio');
        $button.removeClass('playing');
    }

    getFileUrl(file) {
        if (file.id) return `/api/v1/mydocument/${file.id}`;
        if (file.fullpath) return file.fullpath;
        if (file instanceof File || file instanceof Blob) return URL.createObjectURL(file);
        return null;
    }

    isImageFile(ext) {
        return ['png', 'jpg', 'jpeg'].includes(ext);
    }

    isAudioFile(ext) {
        return ['mp3', 'wav', 'mpeg', 'webm'].includes(ext);
    }

    truncateString(str, maxLength) {
        if (!str || str.length <= maxLength) return str;
        return str.slice(0, maxLength) + '...';
    }
}

const fileRenderer = new FileRenderer;
window.fileRenderer = fileRenderer;