<?php

namespace App\Service\File\Processor;

use App\Entity\File;
use App\Entity\Ai\AIModel;
use App\Service\Ai\Agent\AgentTalkService;
use App\Repository\Ai\AgentRepository;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use RuntimeException;

/**
 * Extend from this class if you need to parse or translate a file in a similar manner.
 */
abstract class AbstractFileProcessor
{
    public function __construct(
        protected ParameterBagInterface $params,
        protected AgentRepository $agentRepository,
        protected AgentTalkService $agentTalkService,
        protected EntityManagerInterface $entityManager,
    ) {}

    /**
     * Common method to parse a file.
     * Concrete classes should implement their own logic to read the file.
     *
     * @param string $filePath
     * @return string
     */
    abstract public function parseDocument(string $filePath, ?string $userMessage = ''): string;

    /**
     * Common method to translate a file.
     * Concrete classes can implement if relevant for that file type.
     *
     * @param File $file
     * @return string  Path to the translated file or the translated content
     */
    abstract public function translateDocument(File $file): string;







    protected function ensureUtf8Encoding(string $text): string
    {
        $encoding = mb_detect_encoding($text, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
        if ($encoding !== 'UTF-8') {
            $text = mb_convert_encoding($text, 'UTF-8', $encoding);
        }
        return iconv('UTF-8', 'UTF-8//IGNORE', $text);
    }

    // TODO make this in a helper class
    protected function translate(string $text): string
    {
        if ($this->isNonText($text)) {
            return '';
        }

        // TODO - make this in config
        $model  = $this->entityManager->getRepository(AIModel::class)->findOneBy(['code' => 'gpt_4.1-mini']);
        $agent  = $this->agentRepository->findLatestByCode('translator');
        $agent  = $agent->setModel($model);


        return $this->agentTalkService->executeAgentTalk($agent, ['message' => $text], null, true);
    }

    // TODO make this in a helper class
    protected function fixGrammar(string $text): string
    {
        if ($this->isNonText($text)) {
            return '';
        }

        // TODO - make this in config
        $model  = $this->entityManager->getRepository(AIModel::class)->findOneBy(['code' => 'gpt_4.1-mini']);
        $agent  = $this->agentRepository->findLatestByCode('grammar_fixer');
        $agent  = $agent->setModel($model);


        return $this->agentTalkService->executeAgentTalk($agent, ['message' => $text], null, true);
    }


    private function isNonText(string $text): bool
    {
        // Check if string is empty or contains only whitespace
        if (empty($text) || trim($text) === '') {
            return true;
        }

        // Check if string contains only special characters (\n, \t, \r, spaces)
        $cleaned = preg_replace('/[\s\n\r\t]/', '', $text);
        return empty($cleaned);
    }



    public function getFileExtension(string $filePath): string
    {
        return strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    }



    // TODO - Make this one in a helper class
    protected function createTempDirectory(): string
    {
        $tempDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'temporary_ah_' . uniqid();
        if (!mkdir($tempDir, 0777, true) && !is_dir($tempDir)) {
            throw new RuntimeException(sprintf('Failed to create temp directory "%s"', $tempDir));
        }
        return $tempDir;
    }

    // TODO - Make this one in a helper class
    protected function deleteDirectory(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }

        $items = scandir($dir);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $path = $dir . DIRECTORY_SEPARATOR . $item;
            if (is_dir($path)) {
                $this->deleteDirectory($path);
            } else {
                unlink($path);
            }
        }
        rmdir($dir);
    }


    /**
     * Create the output directory (based on today's date) if needed,
     * then physically write the file contents to disk and return the new path.
     */
    // TODO - Make this one in a helper class
    protected function createOutputFile(string $filename, string $contents): string
    {
        // Create date-based folder if not exist
        $dateFolder   = date('Y-m-d');
        $uploadFolder = $this->params->get('kernel.project_dir') . '/public/uploads/files/' . $dateFolder;

        if (!is_dir($uploadFolder)) {
            mkdir($uploadFolder, 0755, true);
        }

        // Build the output file path
        $outputPath = $uploadFolder . '/' . $filename;

        // Write contents to file
        file_put_contents($outputPath, $contents);

        // Return that new path
        return $outputPath;
    }
}
