
import * as clipboard from "clipboard-polyfill";

$(document).ready(function() {
    $('body').on('click', '.copy_code', function(e) {
        e.preventDefault();
        copyToClip($(this), $(this).closest('.code-section').find('code.code'));
    });
    $('body').on('click', '.copy_msg', function(e) {
        e.preventDefault();
        copyToClip($(this), $(this).closest('.chat-text'));
    });
});

function updateButtonText($button) {
    $button.text(translations['messages.Copied']);
    setTimeout(() => {
        $button.text(translations['messages.Copy']);
    }, 2000);
}


function copyToClip($button, $el) {
    const $content = $el;
    if ($content.length === 0) {
        console.error('No content found to copy.');
        return;
    }
    let isCode = $content.is('code.code');

    if (!isCode) {
        // COMPLETE MSG COPY
        let textToCopy = $content.attr('data-raw-msg');

        // Remove <think>content</think> from textToCopy
        textToCopy = textToCopy.replace(/<think>.*?<\/think>/gs, '').trim();
        textToCopy = textToCopy.replace(/.*<auto_callback>.*\n?/g, '').trim();

        // For non-code content, we'll treat it as Markdown
        const htmlContent = marked(textToCopy);
        // Create a temporary element to hold the HTML content
        const tempElement = document.createElement("div");
        tempElement.innerHTML = htmlContent;

        // Create a clipboard item with both plain text and HTML
        const clipboardItem = new clipboard.ClipboardItem({
            "text/plain": new Blob([textToCopy], { type: "text/plain" }),
            "text/html" : new Blob([tempElement.innerHTML], { type: "text/html" })
        });

        // Write to clipboard
        clipboard.write([clipboardItem])
            .then(() => {
                updateButtonText($button);
            })
            .catch(err => {
                console.error('Failed to copy text to clipboard: ', err);
            });
    } else {
        let textToCopy = $content.text();

        // For code, we'll just copy the plain text
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    console.log('Content copied to clipboard successfully!');
                    updateButtonText($button);
                })
                .catch(err => {
                    console.error('Failed to copy text to clipboard: ', err);
                });
        } else {
            // Fallback for unsupported browsers
            let textarea       = document.createElement('textarea');
                textarea.value = textToCopy;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                updateButtonText($button);
            } catch (err) {
                console.error('Failed to copy text to clipboard: ', err);
            }
            document.body.removeChild(textarea);
        }
    }
}
window.copyToClip = copyToClip;

// Function to copy mermaid text to clipboard
function copyMermaidText(button, event) {
    event.stopPropagation();
    const mermaidDiv = button.closest('.mermaid-diagram');
    const codeElement = mermaidDiv.querySelector('.mermaid-code');

    if (codeElement) {
        const textToCopy = codeElement.textContent;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    // Add scale animation
                    button.classList.add('copied');
                    button.style.animation = 'copy-scale-animation 0.5s ease';

                    // Remove the animation and copied class after animation completes
                    setTimeout(() => {
                        button.classList.remove('copied');
                        button.style.animation = '';
                    }, 500);
                })
                .catch(err => {
                    console.error('Failed to copy mermaid text: ', err);
                });
        } else {
            // Fallback for unsupported browsers
            let textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                button.classList.add('copied');
                button.style.animation = 'copy-scale-animation 0.5s ease';

                setTimeout(() => {
                    button.classList.remove('copied');
                    button.style.animation = '';
                }, 500);
            } catch (err) {
                console.error('Failed to copy mermaid text: ', err);
            }
            document.body.removeChild(textarea);
        }
    }
}
window.copyMermaidText = copyMermaidText;