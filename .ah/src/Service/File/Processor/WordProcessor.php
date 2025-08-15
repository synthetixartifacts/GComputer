<?php

namespace App\Service\File\Processor;

use App\Entity\File;
use App\Repository\Ai\AgentRepository;
use App\Service\Ai\Agent\AgentTalkService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Psr\Log\LoggerInterface;
use ZipArchive;

class WordProcessor extends AbstractFileProcessor
{
    private LoggerInterface $logger;

    public function __construct(
        ParameterBagInterface $params,
        AgentRepository $agentRepository,
        AgentTalkService $agentTalkService,
        EntityManagerInterface $entityManager,
        LoggerInterface $ciaRequestLogger,
    ) {
        parent::__construct($params, $agentRepository, $agentTalkService, $entityManager);

        $this->logger = $ciaRequestLogger;
    }

    /**
     * Parse a .doc, .docx, etc., extracting text content (with limited formatting).
     *
     * @param string      $filePath
     * @param string|null $userMessage
     *
     * @return string
     * @throws \Exception
     */
    public function parseDocument(string $filePath, ?string $userMessage = ''): string
    {
        $tempDir = $this->createTempDirectory();
        try {
            $this->unzipDocx($filePath, $tempDir);
            $content = '';

            // Process main document, headers, and footers
            $xmlFiles = array_merge(
                ['word/document.xml'],
                $this->findHeaderFooterXmlFiles($tempDir)
            );

            foreach ($xmlFiles as $xmlFile) {
                $fullPath = $tempDir . DIRECTORY_SEPARATOR . $xmlFile;
                if (file_exists($fullPath)) {
                    $content .= $this->extractTextFromXml($fullPath) . "\n";
                }
            }

            return $this->ensureUtf8Encoding(trim($content));
        } catch (\Exception $e) {
            error_log('Error parsing Word document: ' . $e->getMessage());
            throw new \Exception("Error processing file: " . $e->getMessage());
        } finally {
            $this->deleteDirectory($tempDir);
        }
    }

    /**
     * Translate a DOCX file using XML-level manipulations.
     *
     * @param File $file
     * @return string  Path to the translated file
     * @throws \Exception
     */
    public function translateDocument(File $file): string
    {
        return $this->processDocxWithCallback(
            $file,
            'translated_',
            fn(string $originalText) => $this->translate($originalText)
        );
    }

    /**
     * Fix grammar of a DOCX file using XML-level manipulations.
     *
     * @param File $file
     * @return string  Path to the grammar-fixed file
     * @throws \Exception
     */
    public function fixGrammarDocument(File $file): string
    {
        return $this->processDocxWithCallback(
            $file,
            'grammar_fixed_',
            fn(string $originalText) => $this->fixGrammar($originalText)
        );
    }

    /**
     * Helper method to process a DOCX file with a given callback.
     *
     * @param File     $file
     * @param string   $tempPrefix
     * @param callable $callback  A function that accepts a string and returns the processed text.
     *
     * @return string  Path to the output file
     * @throws \Exception
     */
    private function processDocxWithCallback(File $file, string $tempPrefix, callable $callback): string
    {
        $extension = $this->getFileExtension($file->getFullPath());
        if ($extension !== 'docx') {
            throw new \Exception('Unsupported file format for XML-based processing. Only .docx is supported.');
        }

        $tempOutputDocx = sys_get_temp_dir() . '/' . $tempPrefix . uniqid() . '.docx';

        try {
            $this->transformDocxFile($file->getFullPath(), $tempOutputDocx, $callback);

            $translatedContent = file_get_contents($tempOutputDocx);

            return $this->createOutputFile($file->getFilename(), $translatedContent);
        } catch (\Exception $e) {
            error_log('Error processing Word document: ' . $e->getMessage());
            throw new \Exception("Error processing file: " . $e->getMessage());
        } finally {
            if (file_exists($tempOutputDocx)) {
                unlink($tempOutputDocx);
            }
        }
    }

    // ---------------------------
    // XML Extraction and Transformation Methods
    // ---------------------------

    private function extractTextFromXml(string $xmlFilePath): string
    {
        $dom = new \DOMDocument();
        $dom->loadXML(file_get_contents($xmlFilePath), LIBXML_NOENT | LIBXML_NOERROR | LIBXML_NOWARNING);

        $xpath = new \DOMXPath($dom);
        $xpath->registerNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main');

        $textNodes = $xpath->query('//w:t');
        $content = [];
        foreach ($textNodes as $node) {
            $content[] = trim($node->nodeValue);
        }

        // Filter and join text nodes, then replace multiple newlines
        return preg_replace('/\n+/', "\n", implode(' ', array_filter($content)));
    }

    /**
     * Unzips a DOCX file (a zip archive) into $destinationPath.
     */
    private function unzipDocx(string $docxFile, string $destinationPath): void
    {
        $zip = new ZipArchive();
        if ($zip->open($docxFile) === true) {
            $zip->extractTo($destinationPath);
            $zip->close();
        } else {
            throw new \Exception("Cannot open docx file: $docxFile");
        }
    }

    /**
     * Finds all header/footer XML files in the `word/` directory.
     */
    private function findHeaderFooterXmlFiles(string $tempDir): array
    {
        $wordDir = $tempDir . DIRECTORY_SEPARATOR . 'word';
        if (!is_dir($wordDir)) {
            return [];
        }

        $result = [];
        $files = scandir($wordDir);
        foreach ($files as $file) {
            if (preg_match('/^(header|footer)\d*\.xml$/', $file)) {
                $result[] = 'word/' . $file;
            }
        }
        return $result;
    }

    /**
     * Act on DOCX file in-place at the XML level, preserving formatting.
     */
    private function transformDocxFile(
        string $inputDocx,
        string $outputDocx,
        callable $callback
    ): void {
        $tempDir = $this->createTempDirectory();

        try {
            $this->unzipDocx($inputDocx, $tempDir);

            $xmlFilesToProcess = array_merge(
                ['word/document.xml'],
                $this->findHeaderFooterXmlFiles($tempDir)
            );

            foreach ($xmlFilesToProcess as $xmlRelativePath) {
                $fullPath = $tempDir . DIRECTORY_SEPARATOR . $xmlRelativePath;
                if (!file_exists($fullPath)) {
                    continue;
                }
                $this->translateXmlFile($fullPath, $callback);
            }

            $this->zipDocx($tempDir, $outputDocx);
        } finally {
            $this->deleteDirectory($tempDir);
        }
    }

    /**
     * Translates all <w:t> elements in one XML file using the provided callback.
     */
    private function translateXmlFile(string $xmlFilePath, callable $translateCallback): void
    {
        $dom = new \DOMDocument();
        $dom->preserveWhiteSpace = false;
        $dom->formatOutput = false;

        $xmlContent = file_get_contents($xmlFilePath);

        if (empty($xmlContent)) {
            $this->logger->error("Empty XML content in file: " . $xmlFilePath);
            return;
        }

        try {
            $dom->loadXML($xmlContent, LIBXML_NOENT | LIBXML_NOERROR | LIBXML_NOWARNING);
        } catch (\Exception $e) {
            $this->logger->error("Failed to load XML: " . $e->getMessage());
            return;
        }

        $xpath = new \DOMXPath($dom);
        $xpath->registerNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main');

        $paragraphs = $xpath->query('//w:p');
        $paragraphCount = $paragraphs ? $paragraphs->length : 0;

        if (!$paragraphs) {
            $this->logger->warning("No paragraphs found in: " . $xmlFilePath);
            return;
        }

        $processedParagraphs = 0;
        foreach ($paragraphs as $pIndex => $pNode) {

            $runNodes = $xpath->query('.//w:r', $pNode);
            $runCount = $runNodes ? $runNodes->length : 0;

            if (!$runNodes || $runNodes->length === 0) {
                continue;
            }

            $firstRun = null;
            $fullText = '';
            foreach ($runNodes as $rNode) {
                if (!$firstRun) {
                    $firstRun = $rNode;
                }
                $tNodes = $xpath->query('.//w:t', $rNode);
                foreach ($tNodes as $tNode) {
                    $fullText .= $tNode->nodeValue;
                }
            }

            $trimmed = trim($fullText);
            if ($trimmed === '') {
                continue;
            }

            try {
                $translated = $translateCallback($trimmed);
            } catch (\Exception $e) {
                $this->logger->error("Translation callback failed: " . $e->getMessage());
                continue;
            }

            try {
                foreach ($runNodes as $rNode) {
                    $pNode->removeChild($rNode);
                }

                $newRun = $firstRun->cloneNode(true);
                $tNodes = $xpath->query('.//w:t', $newRun);
                foreach ($tNodes as $tNode) {
                    $newRun->removeChild($tNode);
                }

                $newT = $dom->createElementNS(
                    'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
                    'w:t',
                    htmlspecialchars($translated)
                );

                if (str_starts_with($translated, ' ') || str_ends_with($translated, ' ')) {
                    $newT->setAttribute('xml:space', 'preserve');
                }

                $newRun->appendChild($newT);
                $pNode->appendChild($newRun);

                $processedParagraphs++;
            } catch (\Exception $e) {
                $this->logger->error("DOM manipulation failed: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            }
        }

        try {
            $result = $dom->save($xmlFilePath);
        } catch (\Exception $e) {
            $this->logger->error("Failed to save XML: " . $e->getMessage() . "\n" . $e->getTraceAsString());
        }
    }

    /**
     * Zips the contents of $sourcePath (unzipped .docx structure) into $outZipPath.
     */
    private function zipDocx(string $sourcePath, string $outZipPath): void
    {
        if (file_exists($outZipPath)) {
            unlink($outZipPath);
        }

        $zip = new ZipArchive();
        if ($zip->open($outZipPath, ZipArchive::CREATE) !== true) {
            throw new \Exception("Cannot create zip file: $outZipPath");
        }

        $this->addFolderToZip($sourcePath, $zip, strlen($sourcePath . DIRECTORY_SEPARATOR));
        $zip->close();
    }

    /**
     * Recursively adds a folder's contents to a ZipArchive.
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
