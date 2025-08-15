class MessageFormatter {
    constructor() {
        this.codeBlockOnGoing = false;
        this.languageToFound  = false;

        this.allowedLanguages = [
            'php', 'json', 'html', 'css', 'javascript', 'typescript', 'python',
            'sql', 'mysql', 'twig', 'ruby', 'java', 'csharp', 'c', 'cpp',
            'go', 'rust', 'swift', 'kotlin', 'bash', 'shell', 'powershell',
            'perl', 'r', 'scala', 'haskell', 'lua', 'matlab', 'vba', 'vbscript',
            'groovy', 'dart', 'objective-c', 'fortran', 'assembly', 'pascal',
            'elixir', 'erlang', 'clojure', 'scheme', 'lisp', 'julia', 'solidity',
            'yaml', 'xml', 'markdown', 'tex', 'latex', 'makefile', 'dockerfile',
            'toml', 'ini', 'graphql', 'protobuf', 'typescript', 'reason', 'coffeescript'
        ];
    }

    formatMessage(text, convertCode = true) {
        const lines            = text.split('\n');
        let   formattedText    = '';
        let   codeBlock        = false;
        let   blockOfContent   = [];
        let   currentContent   = '';
        let   inThinkTag       = false;
        let   inMermaidTag     = false;
        let   currentBlockType = 'text';

        for (let line of lines) {
            line = line + '\n';

            // Check For CodeBlock Start / End
            if (line.trim().startsWith('```')) {
                if (currentContent) {
                    blockOfContent.push({ type: currentBlockType, content: currentContent.trim() });
                    currentContent = '';
                }
                codeBlock         = !codeBlock;
                currentBlockType  = codeBlock ? 'code' : 'text';
                currentContent   += line;
                continue; // Skip adding '```' to current content
            }
            // Check For thinking Process
            else if (line.trim().startsWith('<think>')) {
                if (currentContent) {
                    blockOfContent.push({ type: currentBlockType, content: currentContent.trim() });
                    currentContent = '';
                }
                inThinkTag       = true;
                currentBlockType = 'think';
            }
            // End Thinking Process
            else if (line.trim().startsWith('</think>')) {
                currentContent += line;
                blockOfContent.push({ type: currentBlockType, content: currentContent.trim() });
                currentContent   = '';
                inThinkTag       = false;
                currentBlockType = 'text';
                continue; // Skip processing after </think>
            }
            // Check For Mermaid Start
            else if (line.trim().startsWith('::: mermaid')) {
                if (currentContent) {
                    blockOfContent.push({ type: currentBlockType, content: currentContent.trim() });
                    currentContent = '';
                }
                inMermaidTag = true;
                currentBlockType = 'mermaid';
            }
            // Check For Mermaid End
            else if (line.trim() === ':::' && inMermaidTag) {
                currentContent += line;
                blockOfContent.push({ type: currentBlockType, content: currentContent.trim() });
                currentContent = '';
                inMermaidTag = false;
                currentBlockType = 'text';
                continue;
            }
            // --- NEW IMAGE BLOCK HANDLING ---
            else if (line.trim().startsWith('[img]')) {
                if (currentContent) {
                    blockOfContent.push({ type: currentBlockType, content: currentContent.trim() });
                    currentContent = '';
                }
                currentBlockType = 'image';
                currentContent += line;
                continue;
            }
            else if (line.trim().endsWith('[/img')) {
                currentContent += line;
                blockOfContent.push({ type: currentBlockType, content: currentContent.trim() });
                currentContent = '';
                currentBlockType = 'text';
                continue;
            }

            currentContent += line;
        }

        // Last block of content - if still inside an unclosed mermaid block, treat it as text.
        if (currentContent) {
            if (inMermaidTag) {
                blockOfContent.push({ type: 'text', content: currentContent.trim() });
            } else {
                blockOfContent.push({ type: currentBlockType, content: currentContent.trim() });
            }
        }

        for (const block of blockOfContent) {
            if (block.type === 'code') {
                formattedText += this.formatCodeBlock(block.content);
            } else if (block.type === 'think') {
                formattedText += this.formatThinkBlock(block.content);
            } else if (block.type === 'mermaid') {
                formattedText += this.formatMermaidBlock(block.content);
            } else if (block.type === 'image') {
                formattedText += this.formatImageBlock(block.content);
            } else {
                const temp = this.escapeHtml(block.content);
                formattedText += this.formatTextWithMarkdown(temp, convertCode);
            }
        }

        return formattedText;
    }

    formatThinkBlock(content) {
        const thinkClass = content.includes('</think>') ? 'done-thinking' : 'still-thinking';
        const thinkLabel = content.includes('</think>') ? translations['messages.chatbot.messages.viewThink'] : translations['messages.chatbot.messages.thinking'];

        content = content.replace('<think>', '').replace('</think>', '');
        content = this.escapeHtml(content);
        return `<div class="thinking-process ${thinkClass}">
            <div class="thinking-label"> ${thinkLabel} </div>
            <div class="content">
                ${this.formatTextWithMarkdown(content)}
            </div>
        </div>`;
    }

    formatMermaidBlock(content) {
        // Extract the content and remove the mermaid wrapper tags
        try {
            content = this.cleanMermaid(
              content.replace('::: mermaid', '').replace(':::', '').trim()
            );
        } catch (err) {
            console.warn('Mermaid parse failed – showing raw text', err);
            return `<pre class="mermaid-code-error">${this.escapeHtml(content)}</pre>`;
        }

        // Store the raw mermaid content for copying
        const rawMermaidContent = content.trim();

        if (typeof mermaid !== 'undefined') {
            mermaid.initialize({
                startOnLoad: true,
                theme: 'base',
                themeVariables: {
                  lineColor         : '#333333',
                  primaryColor      : '#949494',
                  primaryBorderColor: '#949494',
                  primaryTextColor  : '#ffffff',
                  secondaryColor    : '#e3c088',
                  secondaryTextColor: '#000000',
                  tertiaryColor     : '#90cdf4'
                }
            });
        }

        const html = `<div class="mermaid-diagram" onclick="openMermaidInNewTab(this)" style="cursor: pointer;">
            <div class="mermaid-header">
                <div class="mermaid-copy" onclick="copyMermaidText(this, event)" title="Copy to clipboard"></div>
                <div class="mermaid-toggle" onclick="toggleMermaidView(this, event)" title="Toggle View"></div>
                <div class="mermaid-download" onclick="downloadMermaidSvg(this); event.stopPropagation();" title="Download"></div>
            </div>
            <div class="mermaid-container">
                <div class="mermaid-real">
                    ${content.trim()}
                </div>
                <pre class="mermaid-code" style="display: none;">${this.escapeHtml(rawMermaidContent)}</pre>
            </div>
        </div>`;

        setTimeout(() => {
            mermaid.init(undefined, '.mermaid-real');
        }, 0);

        return html;
    }

    cleanMermaid(source) {
        // Clean the source by properly quoting text blocks
        let cleanedSource = source;

        // Remove existing quotes and HTML entities
        cleanedSource = cleanedSource
            .replace(/&quot;/g, '')
            .replace(/"/g, '');

        // Replace & per &amp;
        cleanedSource = cleanedSource.replace(/& /g, '- ');

        // Quote content in square brackets [text]
        cleanedSource = cleanedSource.replace(/\[([^\]]+)\]/g, (match, content) => {
            // Don't quote if it's already properly formatted or contains special chars
            if (content.includes('"') || content.trim() === '') {
                return match;
            }
            return `["${content.trim()}"]`;
        });

        // Quote content in curly braces {text}
        cleanedSource = cleanedSource.replace(/\{([^}]+)\}/g, (match, content) => {
            if (content.includes('"') || content.trim() === '') {
                return match;
            }
            return `{"${content.trim()}"}`;
        });

        // Quote content after pipe symbols |text|
        cleanedSource = cleanedSource.replace(/\|([^|]+)\|/g, (match, content) => {
            if (content.includes('"') || content.trim() === '') {
                return match;
            }
            return `|"${content.trim()}"|`;
        });

        // Clean up any double quotes that might have been introduced
        cleanedSource = cleanedSource.replace(/""+/g, '"');

        try {
            // Test if the cleaned version parses correctly
            if (typeof mermaid !== 'undefined') {
                mermaid.parse(cleanedSource);
                console.log('Mermaid cleaned successfully');
                return cleanedSource;
            }
        } catch (error) {
            console.warn('Mermaid cleaning failed, returning original:', error);
            return cleanedSource; // Return original if cleaning fails
        }

        return cleanedSource;
    }

    formatCodeBlock(content) {
        const lines       = content.split('\n');
        const language    = this.extractLanguage(lines[0].trim());
        let   codeContent = '';

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim() === '```') {
                break;
            }
            codeContent += line + '\n';
        }

        // Remove trailing newline
        codeContent = codeContent.trimEnd();

        return `<pre class="code-section">
            <div class="code-header">
                <div class="language">${language}</div>
                <div class="copy_code">Copy</div>
            </div>
            <div class="code-wrapper">
                <code class="code ${language}">${this.escapeHtml(codeContent)}</code>
            </div>
        </pre>`;
    }

    // This method extracts the markdown image syntax from within the <img>...</img> wrapper,
    // then creates a div with class "image" containing an <img> tag.
    formatImageBlock(content) {
        // Remove the <img> and </img> tags
        content = content.replace('<img>', '').replace('</img>', '').trim();

        // Use a regex to capture the alt text and image URL from markdown syntax: ![alt](url)
        const match = content.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (match) {
            const alt = match[1];
            const src = match[2];
            return `<a class="image" style="cursor: pointer;" target="_blank" href="${src}">
                <img src="${src}" alt="${alt}" title="${alt}" />
            </a>`;
        }
        // If no markdown image syntax is found, fall back to plain text in the image div.
        return `<div class="image">${this.escapeHtml(content)}</div>`;
    }


    formatTextWithMarkdown(text, convertCode = true) {
        const renderer = new marked.Renderer();
        const self     = this;

        // Override the link render method
        renderer.link = (infos) => {
            return `<a href="${infos.href}" target="_blank" rel="noopener noreferrer" title="${infos.title || ''}">${infos.text}</a>`;
        };

        // Override the codespan render method
        renderer.codespan = (code) => {
            if (convertCode) {
                return '<code>' + code.text + '</code>';
            } else {
                return '' + code.text + '`';
            }
        };
        renderer.code = function(code, language) {
            return self.formatTextWithMarkdown(code.text);
        };

        // Set the options for marked
        const options = {
            renderer: renderer,
            gfm     : true,
            breaks  : true
        };

        return marked(text, options);
    }

    unescapeHtml(text) {
        const unescapeMap = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#039;': "'"
        };
        return text.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, (m) => unescapeMap[m]);
    }

    escapeHtml(text) {
        const htmlEntities = {
            '&': '&amp;',
            '"': '&quot;',
            "'": '&#39;',
            '<': '&lt;',
            '>': '&gt;'
        };
        return this.cleanMessage(text.replace(/[&"'<>]/g, char => htmlEntities[char]));
    }

    cleanMessage(msg) {
        return msg
                .replace(/\u00a0/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/&lt;auto_callback&gt;/, '')
                .replace(/<auto_callback>/, '')
                .replace(/—/g, ', ');
    }

    convertNewlinesToBr(text) {
        return text.replace(/\n/g, '<br>');
    }

    extractLanguage(inputString) {
        const match = inputString.match(/```(\S+)/);
        return match && match[1] ? match[1].toLowerCase() : '';
    }

    isAllowedLanguage(lang) {
        return this.allowedLanguages.includes(lang.toLowerCase());
    }
}
const messageFormatter = new MessageFormatter();
window.messageFormatter = messageFormatter;


// Add this function to handle the download of the mermaid diagram as an SVG
function downloadMermaidSvg(button) {
    // Get the SVG element from the parent mermaid-diagram div
    const mermaidDiv = button.closest('.mermaid-diagram');
    const svg = mermaidDiv.querySelector('svg');

    if (svg) {
        // Create a Blob from the SVG
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.svg';

        // Trigger download
        document.body.appendChild(a);
        a.click();

        // Cleanup
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}
window.downloadMermaidSvg = downloadMermaidSvg;


// Add this function to open the mermaid diagram in a new tab when clicked
function openMermaidInNewTab(diagramElement) {
    // Get the SVG element from the mermaid diagram
    const svg = diagramElement.querySelector('svg');
    if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const newWindow = window.open("", "_blank");
        if (newWindow) {
            newWindow.document.write(svgData);
            newWindow.document.close();
        }
    }
}
window.openMermaidInNewTab = openMermaidInNewTab;

// Function to toggle between mermaid diagram and text view
function toggleMermaidView(button, event) {
    event.stopPropagation();
    const mermaidDiv = button.closest('.mermaid-diagram');
    const mermaidElement = mermaidDiv.querySelector('.mermaid');
    const codeElement = mermaidDiv.querySelector('.mermaid-code');

    if (mermaidElement.style.display === 'none') {
        // Switch to diagram view
        mermaidElement.style.display = 'block';
        codeElement.style.display = 'none';
        button.classList.remove('showing-code');
    } else {
        // Switch to code view
        mermaidElement.style.display = 'none';
        codeElement.style.display = 'block';
        button.classList.add('showing-code');
    }
}
window.toggleMermaidView = toggleMermaidView;
