<?php

namespace App\Service\File\Processor;

use App\Entity\File;

class TextProcessor extends AbstractFileProcessor
{
    public function parseDocument(string $filePath, ?string $userMessage = ''): string
    {
        return $this->ensureUtf8Encoding(file_get_contents($filePath));
    }

    public function translateDocument(File $file): string
    {
        return $this->processDocument($file, 'translate');
    }

    public function fixGrammarDocument(File $file): string
    {
        return $this->processDocument($file, 'fixGrammar');
    }

    private function processDocument(File $file, string $processingMethod): string
    {
        $fileContent = $this->ensureUtf8Encoding(file_get_contents($file->getFullPath()));

        $processedLines = array_map(
            fn($line) => $this->$processingMethod($line),
            explode("\n", $fileContent)
        );

        return $this->createOutputFile(
            $file->getFilename(),
            implode("\n", $processedLines)
        );
    }
}