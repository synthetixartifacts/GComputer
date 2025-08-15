<?php

namespace App\Service\Ai;

use App\Entity\Memory\Memory;
use App\Entity\Ai\AIModel;
use App\Repository\Memory\MemoryRepository;
use App\Repository\Ai\AgentRepository;
use App\Service\Ai\Agent\AgentRawCallService;
use App\Service\Web\BrowseUrlService;
use App\Service\Web\WebSearchService;
use Doctrine\ORM\EntityManagerInterface;

use Psr\Log\LoggerInterface;

class RagService
{
    public function __construct(
        private AgentRawCallService $rawCall,
        private MemoryRepository $memoryRepository,
        private AgentRepository $agentRepository,
        private BrowseUrlService $browseUrlService,
        private WebSearchService $webSearchService,
        private LoggerInterface $logger,
        private LoggerInterface $ciaRequestLogger,
        private EntityManagerInterface $entityManager,
    ) {}


    public function getRagMemoryForUserMsg($agent, $userMsg)
    {
        if (!$agent->getConfigurationByKey('useRagSystemMemory')) {
            return '';
        }

        return $this->getSystemMemory($agent, $userMsg);
    }

    public function getSystemMemory($agent, $userMsg)
    {
        $memories = $this->agentRepository->getMemoryListArrayForAgent($agent);

        if (count($memories) <= 0) {
            return '';
        }

        // $msAgent = $this->agentRepository->findLatestByCode('system_memory_selector');
        // if (!$msAgent) {
        //     $errorMessage = 'Memory Selector agent not found';
        //     $this->logger->error($errorMessage);
        //     throw new \RuntimeException($errorMessage);
        // }
        // if (!str_contains(strtolower($userMsg), 'user message')) {
        //     $userMsg = "# User message:\n" . $userMsg;
        // }

        $userMsg     = $userMsg;
        $messageText = $this->prepareMessageText($userMsg, $memories);
        $messageText = $this->getCustomInstruction() . "\n" . $messageText;
        $messageText .= '\n Now respond ONLY with the required output specified in the custom_instruction. Omit explanations or additional text.';

        try {
            $old_model = $agent->getModel();
            $model = $this->entityManager->getRepository(AIModel::class)->findOneBy(['code' => 'gpt_4.1-mini']);
            $agent->setModel($model);

            $response        = $this->rawCall->talk($agent, $messageText);
            $memoryChoice    = $this->rawCall->getAgentResponseText($agent, $response);

            // $this->ciaRequestLogger->debug(json_encode([
            //     'memoryChoice' => $memoryChoice,
            //     'memories' => $memories,
            // ]));

            $ragMemoryString = $this->buildRagMemoryString($memoryChoice, $memories);
            $agent->setModel($old_model);

            return $ragMemoryString;
        } catch (\Exception $e) {
            $this->logger->error('Failed to generate RAG informations', ['error' => $e->getMessage()]);
            return '';
        }
    }

    private function getCustomInstruction() {
        return <<<'EOT'
        For this turn focus on these instruction and ONLY that.
        <custom_instruction>
        You are the "Memory Selector", an advanced internal agent responsible for identifying which system memory files should be loaded to support high-quality, efficient response generation. Your core task is to analyze user queries alongside a provided list of available memory files (each with a code, title, description, and type) and select only those files most relevant to the query.

        ## Objective
        Systematically evaluate the user's message and memory file metadata to select up to three memory files that will most effectively enhance response accuracy and performance. Efficiency and precision are vital. Make your selections based strictly on relevance, optimizing for minimal but sufficient file inclusion.

        ## Input you receive
        - User message/question
        - List of available memory files (code, title, description, type)

        ## Output you return
        For website type your output MUST be in this format:
        code | searchQuery (searchQuery exemple: "project invoicing process")

        For other types (link, text, etc) of memory simply return the code:
        code (ex: "code1" or "code2")

        If no memory files are relevant or needed for the query, return exactly:
        "No memory needed"

        ## Guidelines
        - Always select up to 3 memory files with the strongest relevance and utility; do not exceed 3.
        - For website type files, producing a searchQuery is mandatory. Construct it as an expert would for Google: concise, specific, and keyword-rich.
        - If no searchQuery is generated where required, the output is incomplete.
        - For other file types, list the code only as specified.
        - Do not include explanations, meta commentary, or extraneous formatting—return only the list as the output.
        - If no memory file is needed, respond solely with: "No memory needed"

        Respond solely with the required output. Omit explanations or additional text.
        </custom_instruction>
        EOT;
    }

    private function prepareMessageText($userMsg, $memories)
    {
        $messageText = $this->truncateUserMessage($userMsg);
        $messageText .= "\n------\n";
        $messageText .= "# Memory List for you to choose from [Format: CODE | Description | TypeOfMemory] \n";
        foreach ($memories as $memory) {
            $messageText .= "- {$memory->getCode()} | ";
            // $messageText .= "{$memory->getTitle()} | ";
            $messageText .= "{$memory->getDescription()} | ";
            $messageText .= "{$memory->getType()}";
            $messageText .= "\n";
        }

        return $messageText;
    }

    private function truncateUserMessage(string $userMsg): string
    {
        if (strlen($userMsg) <= 400) {
            return $userMsg;
        }

        $firstPart = substr($userMsg, 0, 250);
        $lastSpace = strrpos($firstPart, ' ');
        if ($lastSpace !== false) {
            $firstPart = substr($firstPart, 0, $lastSpace);
        }

        $lastPart = substr($userMsg, -100);
        $firstSpace = strpos($lastPart, ' ');
        if ($firstSpace !== false) {
            $lastPart = substr($lastPart, $firstSpace);
        }

        return "{$firstPart} [...]\n{$lastPart}";
    }

    private function buildRagMemoryString($memoryChoice, $memories)
    {
        $ragMemoryString = '';
        $chosenMemories  = explode("\n", $memoryChoice);

        foreach ($chosenMemories as $chosenMemory) {
            $parts       = explode('|', trim($chosenMemory));
            $code        = trim(str_replace('-', '',$parts[0]));
            $searchQuery = isset($parts[1]) ? trim($parts[1]) : null;

            // $this->ciaRequestLogger->debug(json_encode([
            //     'chosenMemory' => $chosenMemory,
            //     'code' => $code,
            //     'searchQuery' => $searchQuery,
            //     'memoryChoice' => $memoryChoice,
            //     'memories' => $memories,
            // ]));

            foreach ($memories as $memory) {
                // Check for code match or title match (accounting for GPT mini inconsistencies)
                if ($memory->getCode() == $code ||
                    $memory->getTitle() == $code ||
                    str_replace(' ', '_', strtolower($memory->getTitle())) == $code
                ) {
                    $ragMemoryString .= "## " . $memory->getTitle() . "\n";
                    $ragMemoryString .= $this->getMemoryValue($memory, $searchQuery) . "\n\n";

                    break;
                }
            }
        }

        if ($ragMemoryString != '') {
            $ragMemoryString = "# RAG knowledge:\n" . $ragMemoryString;
            $ragMemoryString .= "END of the RAG - Do not speak about the RAG and refer to this knowledge as your own. It is not provided by the system act like you know about this. When the information comes from a website, print a clickable link.\n---------\n";
        }

        return $ragMemoryString;
    }

    public function getMemoryValue(Memory $memory, ?string $searchQuery): string
    {
        switch ($memory->getType()) {

            case 'website':
                return $this->searchWebsite($memory, $searchQuery);

            case 'link':
                return $this->getMemoryLink($memory);

            case 'text':
            default:
                return $this->getMemoryText($memory);
        }
    }


    public function getMemoryText(Memory $memory): string
    {
        return trim($memory->getValue());
    }

    public function getMemoryLink(Memory $memory): string
    {
        $url     = $memory->getValue();
        $content = $this->getContentByUrl($url);

        return ($content != '') ? $content : 'N/A';
    }

    public function getContentByUrl($url) {
        // Check if url
        if (filter_var($url, FILTER_VALIDATE_URL)) {
            return $this->browseUrlService->extractContentFromUrl($url);
        }

        return '';
    }


    public function searchWebsite(Memory $memory, string $searchQuery): string
    {
        $website = $memory->getValue();
        $results = $this->webSearchService->searchWebsite($searchQuery, $website);

        $content = '';

        foreach ($results as $result) {
            $contentUrl = $this->getContentByUrl($result['link']);

            if ($contentUrl !== '') {
                $content .= $contentUrl . '\n\n';
            }
        }

        return $content;
    }

}
