<?php

namespace App\Service\File;

use App\Entity\File;
use App\Service\Ai\Agent\AgentTalkService;
use App\Repository\Ai\AgentRepository;
use App\Service\File\Processor\AbstractFileProcessor;
use App\Service\File\Processor\WordProcessor;
use App\Service\File\Processor\TextProcessor;
use App\Service\File\Processor\PowerPointProcessor;
use Psr\Log\LoggerInterface;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;

class FileProcessor extends AbstractFileProcessor
{
    public function __construct(
        protected ParameterBagInterface $params,
        protected AgentRepository $agentRepository,
        protected AgentTalkService $agentTalkService,
        protected EntityManagerInterface $entityManager,
        protected WordProcessor $wordProcessor,
        protected TextProcessor $textProcessor,
        protected PowerPointProcessor $powerPointProcessor,
        protected LoggerInterface $logger,
    ) {
        parent::__construct($params, $agentRepository, $agentTalkService, $entityManager);
    }

    public function translateDocument(File $file): string
    {
        switch ($file->getExtension()) {
            case 'docx':
            case 'doc':
                return $this->wordProcessor->translateDocument($file);
            case 'txt':
                return $this->textProcessor->translateDocument($file);
            case 'ppt':
            case 'pptx':
                return $this->powerPointProcessor->translateDocument($file);
            case 'csv':
            case 'pdf':
            case 'xlsx':
            case 'xls':
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'mp3':
            case 'mp4':
            case 'mpeg':
            case 'mpga':
            case 'm4a':
            case 'wav':
            case 'webm':
            default:
                throw new \Exception('Unsupported file type');
        }
    }

    public function fixGrammarDocument(File $file): string
    {
        switch ($file->getExtension()) {
            case 'docx':
            case 'doc':
                return $this->wordProcessor->fixGrammarDocument($file);
            case 'txt':
                return $this->textProcessor->fixGrammarDocument($file);
            case 'ppt':
            case 'pptx':
                return $this->powerPointProcessor->fixGrammarDocument($file);
            case 'csv':
            case 'pdf':
            case 'xlsx':
            case 'xls':
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'mp3':
            case 'mp4':
            case 'mpeg':
            case 'mpga':
            case 'm4a':
            case 'wav':
            case 'webm':
            default:
                throw new \Exception('Unsupported file type');
        }
    }



    public function parseDocument(string $filePath, ?string $userMessage = ''): string
    {
        $extension = $this->getFileExtension($filePath);

        switch ($extension) {
            case 'txt':
                return $this->textProcessor->parseDocument($filePath);
            case 'ppt':
            case 'pptx':
                return $this->powerPointProcessor->parseDocument($filePath);
            case 'docx':
            case 'doc':
                return $this->wordProcessor->parseDocument($filePath);
            case 'csv':
                return $this->parseCSV($filePath);
            case 'pdf':
                return $this->parsePdf($filePath);
            case 'xlsx':
            case 'xls':
                return $this->parseXlsx($filePath);
            case 'jpg':
            case 'jpeg':
            case 'png':
                return $this->parseImage($filePath, $userMessage);
            case 'mp3':
            case 'mp4':
            case 'mpeg':
            case 'mpga':
            case 'm4a':
            case 'wav':
            case 'webm':
                return $this->parseAudio($filePath);
            default:
                throw new \Exception('Unsupported file type');
        }
    }


    public function parseAudio(string $filePath): string
    {
        // Ensure the file exists
        if (!file_exists($filePath)) {
            throw new \InvalidArgumentException("File not found: $filePath");
        }

        return $this->agentTalkService->executeAgentWhisper([
            'filePath' => $filePath
        ], true);
    }

    public function parseImage(string $filePath, string $userMessage): string
    {
        // Ensure the file exists
        if (!file_exists($filePath)) {
            throw new \InvalidArgumentException("File not found: $filePath");
        }
        // Get the image as base64
        $imageData = file_get_contents($filePath);
        $base64    = base64_encode($imageData);

        return $this->agentTalkService->executeAgentVision([
            'base64'  => $base64,
            'message' => $userMessage,
        ], true);
    }


    private function parseCSV(string $filePath): string
    {
        $content = '';
        if (($handle = fopen($filePath, "r")) !== FALSE) {
            while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                $data     = array_map([$this, 'ensureUtf8Encoding'], $data);
                $content .= implode(", ", $data) . "\\n";
            }
            fclose($handle);
        }
        return $content;
    }

    private function parsePdf(string $filePath): string
    {
        $parser = new \Smalot\PdfParser\Parser();
        $pdf = $parser->parseFile($filePath);
        $text = $pdf->getText();

        // Ensure we have a string and it's properly encoded
        if (!is_string($text)) {
            if (is_resource($text)) {
                $text = stream_get_contents($text);
            } else {
                $text = (string) $text;
            }
        }

        // Clean and normalize the text to ensure valid UTF-8
        $text = preg_replace('/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/', '', $text);
        $text = mb_convert_encoding($text, 'UTF-8', mb_detect_encoding($text, 'UTF-8, ISO-8859-1, ASCII'));
        $text = iconv('UTF-8', 'UTF-8//IGNORE', $text);

        return trim($text);
    }


    private function parseXlsx(string $filePath): string
    {
        try {
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($filePath);
            $content     = '';
            foreach ($spreadsheet->getWorksheetIterator() as $worksheet) {
                $content .= 'Worksheet: ' . $worksheet->getTitle() . PHP_EOL;
                foreach ($worksheet->getRowIterator() as $row) {
                    $cellIterator = $row->getCellIterator();
                    $cellIterator->setIterateOnlyExistingCells(false);
                    $rowData = [];
                    foreach ($cellIterator as $cell) {
                        $value     = $cell->getValue();
                        $rowData[] = $value !== null ? $this->ensureUtf8Encoding((string)$value) : '';
                    }
                    $content .= implode(" | ", $rowData) .'\\n';
                }
                $content .= '\\n'; // Add an extra newline between worksheets
            }
            return trim($content);
        } catch (\Exception $e) {
            error_log('Error parsing Excel document: ' . $e->getMessage());

            throw new \Exception("Error processing file: " . $e->getMessage());
        }
    }
}