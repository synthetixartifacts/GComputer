<?php

namespace App\Service\Web;

use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;
use League\HTMLToMarkdown\HtmlConverter;
use League\HTMLToMarkdown\Converter\TableConverter;
use Psr\Log\LoggerInterface;

use DOMDocument;
use DOMXPath;
use DOMElement;

class BrowseUrlService
{
    private const CACHE_EXPIRATION = 86400; // 24 hours
    private const CACHE_KEY_PREFIX = 'browse_url_';

    private array $elementsToRemove = [
        'header', 'footer', 'nav', 'aside', 'advertisement',
        'script', 'style', 'noscript', 'iframe', 'svg', 'form',
        'img' // Added img to remove images
    ];

    private array $classesToRemove = [
        'sidebar', 'header', 'footer', 'cookie', 'popup', 'menu',
        'modal', 'breadcrumb', 'banner', 'ad-banner',
        'target-insertion', 'back-to-browsing', 'promotion',
        'comments', 'related-content', 'social-media', 'share',
        'section-metadata', 'article-metadata', 'article-metadata-topics',
        'article-metadata-createdby'
    ];

    public function __construct(
        private CacheInterface $cache,
        private LoggerInterface $ciaRequestLogger,
    ) {}

    public function browseUrl(string $url): array
    {
        if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
            throw new \InvalidArgumentException('Invalid URL parameter');
        }

        $cacheKey = self::CACHE_KEY_PREFIX . md5($url);

        // Uncomment to enable caching:
        // return $this->cache->get($cacheKey, function (ItemInterface $item) use ($url) {
        // $item->expiresAfter(self::CACHE_EXPIRATION);

        try {
            $html = $this->fetchUrl($url);
            $domDocument = $this->createDomDocument($html);

            // Extract title
            $title = $this->extractTitle($domDocument);

            // Clean DOM to keep only relevant content
            $this->cleanDom($domDocument);

            // Pre-process tables before conversion
            $this->preprocessTables($domDocument);

            // Convert to Markdown
            $markdown = $this->convertDomToMarkdown($domDocument);

            return ['title' => $title, 'content' => $markdown];

        } catch (\Exception $e) {
            throw new \RuntimeException('An error occurred: ' . $e->getMessage());
        }
        // });
    }

    private function fetchUrl(string $url): string
    {
        $context = stream_context_create([
            'http' => [
                'header' => 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            ]
        ]);

        $html = file_get_contents($url, false, $context);
        if ($html === false) {
            throw new \RuntimeException('Failed to fetch URL content.');
        }

        return $html;
    }

    private function createDomDocument(string $html): DOMDocument
    {
        $domDocument = new DOMDocument();

        // Add options for more flexible parsing
        $domDocument->strictErrorChecking = false;
        $domDocument->recover = true;

        // Suppress warnings while loading HTML
        libxml_use_internal_errors(true);

        // Pre-process HTML to fix common issues
        $html = $this->preProcessHtml($html);

        // For severely malformed HTML, wrap with a basic structure
        if (!preg_match('/<html/i', $html)) {
            $html = '<!DOCTYPE html><html><head><title>Content</title></head><body>' . $html . '</body></html>';
        }

        // Load with additional parsing options
        $domDocument->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'),
            LIBXML_NOERROR | LIBXML_NOWARNING | LIBXML_HTML_NODEFDTD);

        libxml_clear_errors();

        return $domDocument;
    }

    private function preProcessHtml(string $html): string
    {
        // Remove invisible characters that might cause issues
        $html = preg_replace('/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/', '', $html);

        // Fix multi-line tags by joining lines within tags
        $html = preg_replace('/<([^>]*)\r?\n([^>]*)>/s', '<$1 $2>', $html);

        // Replace &gt; with > when used incorrectly in tag closing
        $html = preg_replace('/<([^>]*?)&gt;/', '<$1>', $html);

        // Fix broken tags
        $html = preg_replace('/<\s+([a-z][a-z0-9]*)/i', '<$1', $html);
        $html = preg_replace('/([a-z][a-z0-9]*)\s+>/i', '$1>', $html);

        // Remove line breaks inside tags
        $html = preg_replace('/<([^>]*)\r?\n([^>]*)>/', '<$1 $2>', $html);

        return $html;
    }

    private function extractTitle(DOMDocument $domDocument): string
    {
        $xpath = new DOMXPath($domDocument);

        // Try to get h1 first
        $h1 = $xpath->query('//h1')->item(0);
        if ($h1) {
            return trim(preg_replace('/\s+/', ' ', $h1->textContent));
        }

        // Fall back to title tag
        $titleTag = $xpath->query('//title')->item(0);
        if ($titleTag) {
            return trim(preg_replace('/\s+/', ' ', $titleTag->textContent));
        }

        return 'Untitled Page';
    }

    private function cleanDom(DOMDocument $domDocument): void
    {
        $xpath = new DOMXPath($domDocument);

        // Remove elements by tag name
        foreach ($this->elementsToRemove as $element) {
            $nodes = $xpath->query("//$element");
            $this->removeNodes($nodes);
        }

        // Remove elements by class
        foreach ($this->classesToRemove as $className) {
            $nodes = $xpath->query("//*[contains(@class, '$className') and local-name() != 'body' and local-name() != 'html']");
            $this->removeNodes($nodes);
        }

        // Process note blocks before removal
        $this->processNoteBlocks($domDocument);

        // Remove empty paragraphs and divs
        $emptyNodes = $xpath->query("//p[not(node())]|//div[not(node())]");
        $this->removeNodes($emptyNodes);

        // Fix headings with line breaks
        $this->normalizeHeadings($domDocument);

        // Unwrap unnecessary divs to simplify the DOM
        $this->unwrapRedundantDivs($domDocument);
    }

    private function processNoteBlocks(DOMDocument $domDocument): void
    {
        $xpath = new DOMXPath($domDocument);
        // Select the main container for the note content, often the last div inside the note block.
        $noteContents = $xpath->query("//div[contains(@class, 'note')]/div[last()]");

        foreach ($noteContents as $noteContentElement) {
            $noteBlock = $noteContentElement->parentNode; // Get the main div.note
            if (!$noteBlock || !$noteBlock->parentNode) continue;

            // Extract text content primarily from the targeted content div
            $noteContent = trim($noteContentElement->textContent);

            // Clean up potential leading "NOTE" if it exists separately
            $noteContent = preg_replace('/^\s*NOTE\s*:?\s*/i', '', $noteContent);
            $noteContent = trim($noteContent);

            if (empty($noteContent)) {
                // If content is empty, maybe try the parent's full text content, minus known labels
                $fullNoteText = trim($noteBlock->textContent);
                $fullNoteText = preg_replace('/^\s*NOTE\s*:?\s*/i', '', $fullNoteText);
                $noteContent = trim($fullNoteText);

                if (empty($noteContent)) {
                    // Remove the block if still empty
                    $noteBlock->parentNode->removeChild($noteBlock);
                    continue;
                }
            }

            // Create a new blockquote element
            $blockquote = $domDocument->createElement('blockquote');

            // Create a paragraph with the content, prepending "NOTE: "
            $paragraph = $domDocument->createElement('p');
            $paragraph->appendChild($domDocument->createTextNode('NOTE: ' . $noteContent));
            $blockquote->appendChild($paragraph);

            // Replace the original note div with our new blockquote
            $noteBlock->parentNode->replaceChild($blockquote, $noteBlock);
        }
    }

    private function unwrapRedundantDivs(DOMDocument $domDocument): void
    {
        $xpath = new DOMXPath($domDocument);

        // Find divs that only contain other divs or simple text
        $divs = $xpath->query('//div[count(child::*) <= 2]');

        for ($i = $divs->length - 1; $i >= 0; $i--) {
            $div = $divs->item($i);
            if (!$div || !$div->parentNode) continue;

            // Only process if this div has a single child or is a simple container
            if ($div->childNodes->length === 1) {
                $child = $div->firstChild;

                // Extract the child and place it at the div's position
                $div->parentNode->replaceChild($child->cloneNode(true), $div);
            }
        }
    }

    private function normalizeHeadings(DOMDocument $domDocument): void
    {
        $xpath = new DOMXPath($domDocument);
        $headings = $xpath->query('//h1|//h2|//h3|//h4|//h5|//h6');

        foreach ($headings as $heading) {
            // Get text content and normalize whitespace
            $text = $heading->textContent;
            $text = trim(preg_replace('/\s+/', ' ', $text));

            // Clear existing content
            while ($heading->firstChild) {
                $heading->removeChild($heading->firstChild);
            }

            // Add normalized text
            $heading->appendChild($domDocument->createTextNode($text));
        }
    }

    private function removeNodes(\DOMNodeList $nodes): void
    {
        // We need to iterate backwards as the nodelist gets modified during removal
        for ($i = $nodes->length - 1; $i >= 0; $i--) {
            $node = $nodes->item($i);
            if ($node && $node->parentNode) {
                $node->parentNode->removeChild($node);
            }
        }
    }

    /**
     * Pre-process tables to ensure they're properly formatted for conversion
     */
    private function preprocessTables(DOMDocument $domDocument): void
    {
        $xpath = new DOMXPath($domDocument);
        $tables = $xpath->query('//table');

        foreach ($tables as $table) {
            // Add a special class to mark tables for our custom processing
            $table->setAttribute('class', ($table->getAttribute('class') ? $table->getAttribute('class') . ' ' : '') . 'markdown-table');

            // Clean up table structure to ensure it has proper thead/tbody/tr/th/td elements
            $this->normalizeTableStructure($table, $domDocument);

            // Remove any comments, hidden elements, or other problematic nodes inside the table
            $this->cleanTableContent($table, $xpath);

            // Ensure all cells have clean, normalized content
            $this->normalizeTableCells($table, $xpath);
        }
    }

    /**
     * Ensures the table has a proper structure with thead/tbody/tr/th/td elements
     */
    private function normalizeTableStructure(DOMElement $table, DOMDocument $domDocument): void
    {
        $xpath = new DOMXPath($domDocument);

        // Ensure there's a thead if the table has th elements in the first row
        $firstRow = $xpath->query('./tr[1]|./*/tr[1]', $table)->item(0);

        if ($firstRow) {
            $hasHeaderCells = $xpath->query('./th', $firstRow)->length > 0;

            // If there are th cells in the first row and no thead, create one
            if ($hasHeaderCells && !$xpath->query('./thead', $table)->length) {
                // Check if firstRow is directly under table or under tbody
                $parent = $firstRow->parentNode;

                if ($parent->nodeName === 'table') {
                    // Create thead
                    $thead = $domDocument->createElement('thead');
                    $table->insertBefore($thead, $parent->firstChild);
                    $thead->appendChild($firstRow);
                } else if ($parent->nodeName === 'tbody') {
                    // Create thead before tbody
                    $thead = $domDocument->createElement('thead');
                    $table->insertBefore($thead, $parent);
                    $thead->appendChild($firstRow);
                }
            }
        }

        // Ensure tbody exists
        if (!$xpath->query('./tbody', $table)->length) {
            $tbody = $domDocument->createElement('tbody');

            // Move all remaining direct tr children to the tbody
            $rows = $xpath->query('./tr', $table);
            if ($rows->length > 0) {
                // Need to collect nodes first as the NodeList will be live and change as we move nodes
                $rowsToMove = [];
                foreach ($rows as $row) {
                    $rowsToMove[] = $row;
                }

                foreach ($rowsToMove as $row) {
                    $tbody->appendChild($row);
                }

                $table->appendChild($tbody);
            }
        }
    }

    /**
     * Removes comments and problematic elements from table
     */
    private function cleanTableContent(DOMElement $table, DOMXPath $xpath): void
    {
        // Remove HTML comments
        $comments = $xpath->query('.//comment()', $table);
        foreach ($comments as $comment) {
            if ($comment->parentNode) {
                $comment->parentNode->removeChild($comment);
            }
        }

        // Remove hidden elements
        $hiddenElements = $xpath->query('.//*[@style="display:none"]|.//*[@hidden]', $table);
        $this->removeNodes($hiddenElements);
    }

    /**
     * Ensures all table cells have clean, normalized content
     */
    private function normalizeTableCells(DOMElement $table, DOMXPath $xpath): void
    {
        $cells = $xpath->query('.//th|.//td', $table);

        foreach ($cells as $cell) {
            // Trim whitespace in cell content
            $text = trim($cell->textContent);

            // If cell only has text content (no elements), simplify it
            if ($cell->childNodes->length === 1 && $cell->firstChild->nodeType === XML_TEXT_NODE) {
                // Remove existing content
                while ($cell->firstChild) {
                    $cell->removeChild($cell->firstChild);
                }

                // Add cleaned text
                $cell->appendChild($cell->ownerDocument->createTextNode($text));
            }

            // Make sure empty cells have at least a space
            if (empty($text)) {
                // Clear the cell
                while ($cell->firstChild) {
                    $cell->removeChild($cell->firstChild);
                }

                // Add a non-breaking space to prevent cell collapse
                $cell->appendChild($cell->ownerDocument->createTextNode(' '));
            }
        }
    }

    private function convertDomToMarkdown(DOMDocument $domDocument): string
    {
        try {
            // First, process tables to markdown format manually
            $this->processTablesBeforeConversion($domDocument);

            // Get the clean HTML content
            $html = $domDocument->saveHTML();

            // Configure the HTML to Markdown converter
            $converter = new HtmlConverter();
            $converter->getConfig()->setOption('hard_break', false);
            $converter->getConfig()->setOption('use_autolinks', true);
            $converter->getConfig()->setOption('strip_tags', true);
            $converter->getConfig()->setOption('preserve_comments', false);
            $converter->getConfig()->setOption('remove_nodes', 'style script object iframe svg');

            // Add a custom converter for tables
            $tableConverter = new TableConverter();
            $converter->getEnvironment()->addConverter($tableConverter);

            // Convert to markdown
            $markdown = $converter->convert($html);

            // Apply cleanup rules
            $markdown = $this->cleanupMarkdown($markdown);
            $markdown = $this->cleanNewLines($markdown);

            return $markdown;
        } catch (\Exception $e) {
            // Extract text directly if conversion fails
            $body = $domDocument->getElementsByTagName('body')->item(0);
            if ($body) {
                $text = trim(preg_replace('/\s+/', ' ', $body->textContent));
                return "Content extracted (fallback method):\n\n" . $text;
            }
            throw $e; // Re-throw if we couldn't extract anything useful
        }
    }

    /**
     * Process tables to markdown format before general conversion
     */
    private function processTablesBeforeConversion(DOMDocument $domDocument): void
    {
        $xpath = new DOMXPath($domDocument);
        $tables = $xpath->query('//table[@class="markdown-table"]');

        foreach ($tables as $table) {
            // Create a container to replace the table
            $container = $domDocument->createElement('div');
            $container->setAttribute('class', 'markdown-table-container');

            // Generate markdown table content
            $markdown = $this->tableToMarkdown($table, $xpath);

            // Create a pre element to hold the markdown table
            $pre = $domDocument->createElement('pre');
            $pre->textContent = $markdown;
            $container->appendChild($pre);

            // Replace the original table with our container
            if ($table->parentNode) {
                $table->parentNode->replaceChild($container, $table);
            }
        }
    }

    /**
     * Convert a table element to markdown format
     */
    private function tableToMarkdown(DOMElement $table, DOMXPath $xpath): string
    {
        $markdown = "";
        $rows = [];
        $headerRow = [];
        $maxCols = 0;

        // Process header row
        $headers = $xpath->query('.//thead//th', $table);
        if ($headers->length > 0) {
            foreach ($headers as $th) {
                $headerRow[] = trim($th->textContent);
            }
            $maxCols = max($maxCols, count($headerRow));
            $rows[] = $headerRow;
        }

        // Process body rows
        $bodyRows = $xpath->query('.//tbody//tr', $table);
        foreach ($bodyRows as $tr) {
            $rowData = [];
            $cells = $xpath->query('.//td', $tr);

            foreach ($cells as $td) {
                $rowData[] = trim($td->textContent);
            }

            $maxCols = max($maxCols, count($rowData));
            $rows[] = $rowData;
        }

        // If we have no rows, return empty string
        if (empty($rows)) {
            return "";
        }

        // Ensure all rows have the same number of columns
        foreach ($rows as &$row) {
            while (count($row) < $maxCols) {
                $row[] = " ";
            }
        }

        // Build the markdown table
        // Header row
        $markdown .= "| " . implode(" | ", $rows[0]) . " |\n";

        // Separator row
        $separators = array_fill(0, $maxCols, "---");
        $markdown .= "| " . implode(" | ", $separators) . " |\n";

        // Data rows
        for ($i = 1; $i < count($rows); $i++) {
            $markdown .= "| " . implode(" | ", $rows[$i]) . " |\n";
        }

        return $markdown;
    }

    private function cleanupMarkdown(string $markdown): string
    {
        // Remove HTML comments first
        $markdown = preg_replace('/<!--.*?-->/s', '', $markdown);

        // Remove Markdown image references
        $markdown = preg_replace('/!\[(.*?)\]\((.*?)\)/', '', $markdown);

        // Normalize line endings to Unix style
        $markdown = str_replace("\r\n", "\n", $markdown);
        $markdown = str_replace("\r", "\n", $markdown); // Handle Mac line endings too

        // Fix Setext-style headers first (convert to ATX)
        $markdown = preg_replace('/^(.+)\n=+\n/m', "# $1\n\n", $markdown);
        $markdown = preg_replace('/^(.+)\n-+\n/m', "## $1\n\n", $markdown);

        // Ensure ATX headings have exactly one space after hashes and trim trailing whitespace
        $markdown = preg_replace('/^(#{1,6})[ \t]+(.+?)[ \t]*$/m', '$1 $2', $markdown);

        // --- Start Heading Spacing Fix ---
        // Ensure exactly two newlines \*before\* a heading, unless it's the start of the doc or follows another heading/hr.
        $markdown = preg_replace('/([^\n#-])\n(#{1,6}\s)/m', '$1\n\n$2', $markdown);
        // Ensure it's preceded by two newlines if it's the first non-whitespace content
        $markdown = preg_replace('/^\s*(#{1,6}\s)/m', '\n\n$1', $markdown);

        // Ensure exactly two newlines \*after\* a heading, unless followed by another heading or end of doc.
        $markdown = preg_replace('/(#{1,6}\s.+)\n(?!\n|#|$)/m', '$1\n\n', $markdown);
        // Ensure headings are followed by a blank line even if it's the last content
         $markdown = preg_replace('/(#{1,6}\s.+)$/m', '$1\n', $markdown);
        // --- End Heading Spacing Fix ---

        // Remove empty heading lines (e.g., "# " which might result from previous steps)
        $markdown = preg_replace('/^#{1,6}\s*$/m', '', $markdown);

        // Normalize horizontal rules and ensure spacing
        $markdown = preg_replace('/^[ \t]*(\* *){3,}|(- *){3,}|(\_ *){3,}[ \t]*$/m', '---', $markdown);
        $markdown = preg_replace('/^\s*---\s*$/m', '\n\n---\n\n', $markdown); // Ensure spacing around HRs

        // Clean up blockquotes (including the ones generated for notes)
        $markdown = preg_replace('/>\[ \t\]*NOTE:?\[ \t\]*/m', '**NOTE:** ', $markdown); // Bold the NOTE label
        $markdown = preg_replace('/>\[ \t\]+/m', '> ', $markdown); // Ensure single space after >
        $markdown = preg_replace('/(>\[ \t\].*)\n>\[ \t\]*$/m', '$1', $markdown); // Join consecutive blockquote lines if the second is empty/whitespace
        $markdown = preg_replace('/(>\[ \t\].+\S)\n(?!>|\n)/m', '$1 $2', $markdown); // Join wrapped lines inside blockquotes IF next line isn't blockquote or blank
        // Ensure blockquotes are surrounded by blank lines
        $markdown = preg_replace('/([^\n])\n(>\[ \t\])/m', '$1\n \n$2', $markdown); // Before
        $markdown = preg_replace('/(>\[ \t\].+)\n([^>\n])/m', '$1\n\n$2', $markdown); // After

        // Clean up lists
        $markdown = preg_replace('/^([ \t]*[\*+-])[ \t]+/m', '$1 ', $markdown); // Ensure exactly one space after marker
        // Join list item lines if the next line isn't a list item, indented, or blank
        $markdown = preg_replace('/^([ \t]*[\*+-][ \t]+.*[^\n])\n(?!\s*[\*+-]|\s{2,}|\n)/m', '$1 $2', $markdown);
        // Ensure lists are preceded by a blank line unless nested or following a heading
        $markdown = preg_replace('/([^\n#])\n([ \t]*[\*+-][ \t])/m', '$1\n\n$2', $markdown);
        // Ensure lists are followed by a blank line unless followed by another list item/indented or end of doc
        $markdown = preg_replace('/([ \t]*[\*+-][ \t].+)\n(?!\s*[\*+-]|\s{2,}|\n|$)/m', '$1\n\n', $markdown);

        // Remove colons at the end of a line followed by a block element start (heading, list, blockquote, hr)
        $markdown = preg_replace('/: [ \t]*\n+(?=[ \t]*[-\*>#]|---)/m', '\n\n', $markdown);

        // Clean up any empty links
        $markdown = preg_replace('/\[([^\]]*)\]\(\s*\)/', '$1', $markdown);
        $markdown = preg_replace('/\[\]\(([^)]+)\)/', '$1', $markdown);

        // Remove standalone 's' lines (specific artifact)
        $markdown = preg_replace('/^[ \t]*s[ \t]*$/m', '', $markdown);

        // Final whitespace cleanup:
        // 1. Replace multiple spaces with single space
        $markdown = preg_replace('/[ \t]+/', ' ', $markdown);
        // 2. Remove trailing spaces from lines
        $markdown = preg_replace('/ +\n/m', '\n', $markdown);
        // 3. Collapse multiple blank lines (3+ newlines) into one blank line (2 newlines)
        $markdown = preg_replace('/\n{3,}/', '\n\n', $markdown);
        // 4. Remove leading/trailing whitespace from the whole string
        $markdown = trim($markdown);

        // Clean up any potential empty lines caused by image removal
        $markdown = preg_replace('/\n{3,}/', '\n\n', $markdown);

        // Ensure final newline
        return $markdown . "\n";
    }

    private function cleanNewLines(string $text): string
    {
        return $text;
    }

    /**
     * Extracts all unique URLs from text
     */
    public function extractUrlsFromMessage(string $message): array
    {
        $pattern = '/https?:\/\/[\w\-\.\/\+&%\$#=~\(\)\[\]\{\}\?]+/i';
        preg_match_all($pattern, $message, $matches);

        return array_unique($matches[0]);
    }

    /**
     * Returns a markdown-formatted block per URL
     *
     * @param string $url
     * @return string
     */
    public function extractContentFromUrl(string $url): string
    {
        try {
            $data = $this->browseUrl($url);

            $content = str_replace('\n', "\n", $data['content']);

            $result = "-----------" . PHP_EOL
                        . "### URL - $url" . PHP_EOL
                        . "### Content Page as Markdown: " . PHP_EOL . PHP_EOL
                        . $content . PHP_EOL
                        . "-----------";
        } catch (\Exception $e) {
            $result = "-----------" . PHP_EOL
                        . "### URL - $url" . PHP_EOL
                        . "**Error:** Failed to extract content - {$e->getMessage()}" . PHP_EOL
                        . "-----------";
        }

        return $result;
    }
}