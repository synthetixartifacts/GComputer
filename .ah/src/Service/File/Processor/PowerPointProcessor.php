<?php

namespace App\Service\File\Processor;

use App\Entity\File;
use App\Repository\Ai\AgentRepository;
use App\Service\Ai\Agent\AgentTalkService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use RuntimeException;
use ZipArchive;

class PowerPointProcessor extends AbstractFileProcessor
{
    public function __construct(
        ParameterBagInterface $params,
        AgentRepository $agentRepository,
        AgentTalkService $agentTalkService,
        EntityManagerInterface $entityManager
    ) {
        parent::__construct($params, $agentRepository, $agentTalkService, $entityManager);
    }

    /**
     * Extracts text from a .pptx file.
     *
     * @throws \Exception
     */
    public function parseDocument(string $filePath, ?string $userMessage = ''): string
    {
        $this->validatePptx($filePath);

        $tempDir = $this->createTempDirectory();
        try {
            $this->unzipPptx($filePath, $tempDir);
            $slideFiles = glob($tempDir . '/ppt/slides/slide*.xml');
            $textContent = '';

            if ($slideFiles) {
                foreach ($slideFiles as $slideFile) {
                    $textContent .= $this->extractTextFromXml($slideFile) . "\n";
                }
            }
        } finally {
            // Ensure temporary directory is always cleaned up.
            $this->deleteDirectory($tempDir);
        }

        return $this->ensureUtf8Encoding(trim($textContent));
    }

    /**
     * Translates a .pptx file by processing its XML files.
     *
     * @throws \Exception
     */
    public function translateDocument(File $file): string
    {
        return $this->processSlidesDocument($file, function (string $originalText) {
            return $this->translate($originalText);
        });
    }

    /**
     * Fixes grammar in a .pptx file by processing its XML files.
     *
     * @throws \Exception
     */
    public function fixGrammarDocument(File $file): string
    {
        return $this->processSlidesDocument($file, function (string $originalText) {
            return $this->fixGrammar($originalText);
        });
    }

    /**
     * Common workflow to process slide XML files in a PPTX.
     *
     * Steps:
     * 1. Validate file extension.
     * 2. Create a temporary directory and unzip the PPTX.
     * 3. Process each slide file using the provided callback.
     * 4. Zip the processed files into a new PPTX.
     * 5. Create and return a new output file.
     *
     * @throws \Exception
     */
    private function processSlidesDocument(File $file, callable $textProcessor): string
    {
        $filePath = $file->getFullPath();
        $this->validatePptx($filePath);

        $tempDir = $this->createTempDirectory();
        try {
            // Unzip original PPTX
            $this->unzipPptx($filePath, $tempDir);

            // Process slide XML files
            $slideFiles = glob($tempDir . '/ppt/slides/slide*.xml');
            if ($slideFiles) {
                foreach ($slideFiles as $slideFile) {
                    $this->translateXmlFile($slideFile, function (string $originalText) use ($textProcessor) {
                        return $textProcessor($originalText);
                    });
                }
            }

            // Zip processed files into a new PPTX
            $tempOutputPptx = sys_get_temp_dir() . '/translated_' . uniqid() . '.pptx';
            $this->zipPptx($tempDir, $tempOutputPptx);

            // Create output file from zip content
            $translatedContent = file_get_contents($tempOutputPptx);
            $newPath = $this->createOutputFile($file->getFilename(), $translatedContent);

            if (file_exists($tempOutputPptx)) {
                unlink($tempOutputPptx);
            }
            return $newPath;
        } finally {
            // Always clean up the temporary directory.
            $this->deleteDirectory($tempDir);
        }
    }

    /**
     * Validates that the file is a .pptx.
     *
     * @throws \Exception
     */
    private function validatePptx(string $filePath): void
    {
        if ($this->getFileExtension($filePath) !== 'pptx') {
            throw new \Exception('Unsupported file format. Only .pptx is handled in this XML approach.');
        }
    }

    /**
     * Extract text from an XML file by searching for <a:t> elements.
     */
    private function extractTextFromXml(string $xmlFilePath): string
    {
        $xmlContent = file_get_contents($xmlFilePath);
        if (!$xmlContent) {
            return '';
        }

        $dom = new \DOMDocument();
        $dom->preserveWhiteSpace = false;
        $dom->formatOutput       = false;
        // Suppress warnings for invalid XML characters
        @$dom->loadXML($xmlContent, LIBXML_NOENT | LIBXML_NOERROR | LIBXML_NOWARNING);

        $xpath = new \DOMXPath($dom);
        $xpath->registerNamespace('a', 'http://schemas.openxmlformats.org/drawingml/2006/main');
        $xpath->registerNamespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships');
        $xpath->registerNamespace('p', 'http://schemas.openxmlformats.org/presentationml/2006/main');

        $textNodes = $xpath->query('//a:t');

        $content = '';
        if ($textNodes) {
            foreach ($textNodes as $node) {
                $content .= $node->nodeValue . " ";
            }
        }
        return trim($content);
    }

    /**
     * Processes a slide XML file by applying a translation callback to its text nodes.
     */
    private function translateXmlFile(string $xmlFilePath, callable $translateCallback): void
    {
        $xmlContent = file_get_contents($xmlFilePath);
        if (!$xmlContent) {
            return;
        }

        $dom = new \DOMDocument();
        $dom->preserveWhiteSpace = false;
        $dom->formatOutput       = false;
        @$dom->loadXML($xmlContent, LIBXML_NOENT | LIBXML_NOERROR | LIBXML_NOWARNING);

        $xpath = new \DOMXPath($dom);
        $xpath->registerNamespace('a', 'http://schemas.openxmlformats.org/drawingml/2006/main');
        $xpath->registerNamespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships');
        $xpath->registerNamespace('p', 'http://schemas.openxmlformats.org/presentationml/2006/main');
        $xpath->registerNamespace('mc', 'http://schemas.openxmlformats.org/markup-compatibility/2006');
        $xpath->registerNamespace('wps', 'http://schemas.microsoft.com/office/word/2010/wordprocessingShape');

        // Process all non-empty text nodes
        $textNodes = $xpath->query('//a:t[normalize-space(.) != ""]');
        if ($textNodes) {
            foreach ($textNodes as $node) {
                $original = $node->nodeValue;
                if (trim($original) !== '') {
                    // Preserve leading and trailing spaces
                    $hasLeadingSpace = str_starts_with($original, ' ');
                    $hasTrailingSpace = str_ends_with($original, ' ');
                    $translated = $translateCallback(trim($original));

                    if ($hasLeadingSpace) {
                        $translated = ' ' . $translated;
                    }
                    if ($hasTrailingSpace) {
                        $translated .= ' ';
                    }

                    // Preserve xml:space attribute if needed
                    $spaceAttr = $node->getAttribute('xml:space');

                    // Replace content with the new translated text node
                    $newTextNode = $dom->createTextNode($translated);
                    while ($node->hasChildNodes()) {
                        $node->removeChild($node->firstChild);
                    }
                    $node->appendChild($newTextNode);

                    if ($spaceAttr || $hasLeadingSpace || $hasTrailingSpace) {
                        $node->setAttribute('xml:space', 'preserve');
                    }
                }
            }
        }

        $dom->save($xmlFilePath);
    }

    /**
     * Unzips a .pptx file to the specified destination.
     *
     * @throws \Exception
     */
    private function unzipPptx(string $pptxFile, string $destinationPath): void
    {
        $zip = new ZipArchive();
        if ($zip->open($pptxFile) === true) {
            $zip->extractTo($destinationPath);
            $zip->close();
        } else {
            throw new \Exception("Cannot open pptx file: $pptxFile");
        }
    }

    /**
     * Zips the content of a folder into a new .pptx file.
     *
     * @throws RuntimeException
     */
    private function zipPptx(string $sourcePath, string $outZipPath): void
    {
        if (file_exists($outZipPath)) {
            unlink($outZipPath);
        }

        $zip = new ZipArchive();
        if ($zip->open($outZipPath, ZipArchive::CREATE) !== true) {
            throw new RuntimeException("Cannot create zip file: $outZipPath");
        }

        $this->addFolderToZip($sourcePath, $zip, strlen($sourcePath . DIRECTORY_SEPARATOR));
        $zip->close();
    }

    /**
     * Recursively adds a folder’s contents to a ZipArchive.
     */
    private function addFolderToZip(string $folderPath, ZipArchive $zip, int $removePathLength): void
    {
        $handle = opendir($folderPath);
        if (!$handle) {
            return;
        }

        while (false !== ($file = readdir($handle))) {
            if ($file === '.' || $file === '..') {
                continue;
            }

            $filePath = $folderPath . DIRECTORY_SEPARATOR . $file;
            if (is_dir($filePath)) {
                $this->addFolderToZip($filePath, $zip, $removePathLength);
            } else {
                $relativePath = substr($filePath, $removePathLength);
                $zip->addFile($filePath, $relativePath);
            }
        }

        closedir($handle);
    }
}
