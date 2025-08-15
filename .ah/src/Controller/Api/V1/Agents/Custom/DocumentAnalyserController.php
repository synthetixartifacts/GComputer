<?php

namespace App\Controller\Api\V1\Agents\Custom;

use App\Controller\Api\V1\Agents\AbstractAgentApiController;
use App\Entity\Ai\AIAgent;
use App\Entity\Ai\AIModel;
use App\Service\File\FileEntityService;
use App\Service\Api\ApiHelperService;
use App\Service\Ai\Agent\AgentTalkService;
use App\Service\DiscussionService;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Doctrine\ORM\EntityManagerInterface;

#[Route('/api/v1', name: 'api_v1_')]
class DocumentAnalyserController extends AbstractAgentApiController
{
    public function __construct(
        protected FileEntityService      $fileEntityService,
        protected ApiHelperService       $apiHelperService,
        protected AgentTalkService       $agentTalkService,
        protected DiscussionService      $discussionService,
        protected EntityManagerInterface $entityManager,
    ) {
        parent::__construct(
            $apiHelperService,
            $agentTalkService,
            $discussionService,
            $entityManager
        );
    }

    #[Route('/agent/talk/document_analyser', name: 'agent_talk_document_analyser', methods: ['POST', 'GET'], priority: 1)]
    public function apiTalk(): JsonResponse {
        return $this->apiHelperService->notImplementedYetResponse();
    }

    #[Route('/agent/stream/document_analyser', name: 'agent_talk_stream_document_analyser', methods: ['POST', 'GET'], priority: 1)]
    public function apiTalkStream(Request $request): StreamedResponse|JsonResponse
    {
        // Validate access and extract request data
        $agent = $this->apiHelperService->validateAgentAccessRequest('document_analyser', $request);
        if ($agent instanceof JsonResponse) {
            return $agent;
        }
        $data = $this->apiHelperService->extractRequestData($request);

        // Manage discussion: get or create and validate access
        $user = $this->apiHelperService->getUser();
        $discussion = $this->discussionService->getDiscussionByKeyUserOrCreate(
            $data['discussionKey'] ?? null,
            $user,
            $agent,
            true
        );
        if (!$this->discussionService->validateDiscussionAccess($discussion, $user, $agent)) {
            return $this->apiHelperService->errorUnauthorizedResponse();
        }

        // If no file was provided, process the agent talk normally.
        if (empty($data['fileIds']) || count($data['fileIds']) <= 0) {
            return $this->agentTalkService->executeAgentTalkStream($agent, $data, $discussion);
        }

        $userMsg = $data['message'] ?? '';
        $fileIds = $data['fileIds'];
        $content = $this->fileEntityService->getFilesContentMsgByIdsForUserMsg($fileIds, true);
        $lines   = $this->getFileLines($content);
        unset($data['fileIds']);

        if (!empty(trim($userMsg))) {
            $userMsg = '<custom_user_intruction>These instructions take precedence over the default ones and will replaced even the struture if asked to:\n\n' . $userMsg  . '</custom_user_intruction>';
        }

        // For small documents, build and send a simple message
        if (count($lines) < 30) {
            return $this->smallDocument($agent, $content, $userMsg, $discussion);
        }

        // For large documents
        return $this->largeDocument($agent, $content, $lines, $userMsg, $discussion);
    }

    private function smallDocument($agent, $content, $userMsg, $discussion) {
        $content .= $userMsg;
        $agent = $this->applyMergeModel($agent);

        return $this->agentTalkService->executeAgentTalkStream($agent, ['message' => $content], $discussion);
    }

    private function largeDocument($agent, $content, $lines, $userMsg, $discussion)
    {
        // Get Document Overview and Summary first
        $startInstruction = <<<INSTRUCTION
        <custom_instruction>
        You will only return the Document Overview and Summary sections following the required structure. Nothing else.
        </custom_instruction>
        INSTRUCTION;

        $msg = $this->truncateMessage($content) . $startInstruction . $userMsg;
        $introStructure = $this->agentTalkService->executeAgentTalk($agent, ['message' => $msg], null, true);
        $summary = $this->extractSummary($introStructure);
        $finalMsg = $introStructure;

        // Process sections
        $loopFor = ['Key Points', 'Technical Elements', 'Business Analysis'];
        $loopInstruction = <<<INSTRUCTION
        \n\n
        ----
        <custom_instruction>
        You will only return the %s section. Nothing else, not even the section title.
        If there are no relevant elements for this section, return "Not Applicable".

        INSTRUCTION;

        $summaryContext = ($summary) ? '<context>We are currently analyzing a document chunk by chunk due to its size. Here is the overall summary so you can better understand the global context to do your job:' . PHP_EOL . PHP_EOL . $summary . PHP_EOL . '</context>' . PHP_EOL . PHP_EOL : '';

        foreach ($loopFor as $section) {
            $instruction = sprintf($loopInstruction, $section);
            $msg = $this->processDocumentByChunksForInstruction($summaryContext, $instruction, $lines, $agent, $userMsg);

            if (empty($msg) || $msg === 'Not Applicable') {
                continue;
            }

            $finalMsg .= PHP_EOL . "### " . $section . PHP_EOL . $msg;
        }

        // If user instruction present, process final output with user context
        if (!empty($userMsg)) {
            $msg = '# Context \n You will received the created output we did but, this time the user is also giving specific instruction that we must focus on. You will return the complete output needed in this context.\n-----\n'. $finalMsg . '\n\n' . $userMsg;
            $finalMsg = $this->agentTalkService->executeAgentTalk($agent, ['message' => $msg], null, true);
        }

        return $this->streamForceResponse($agent, $finalMsg, $discussion);
    }

    private function extractSummary(string $content): ?string
    {
        if (empty($content)) {
            return null;
        }

        $summaryContent = strstr($content, '### Summary');
        if ($summaryContent === false) {
            return null;
        }

        $summaryContent = str_replace('### Summary', '', $summaryContent);

        if (($nextSection = strpos($summaryContent, '###')) !== false) {
            $summaryContent = substr($summaryContent, 0, $nextSection);
        }

        return trim($summaryContent);
    }

    private function processDocumentByChunksForInstruction($summaryContext, $instruction, $lines, $agent, $userMsg) {
        $chunks = array_chunk($lines, 40);
        $chunkStrings = array_map(fn($chunk) => implode("\n", $chunk), $chunks);
        $responseParts = [];

        foreach ($chunkStrings as $index => $chunk) {
            $number = $index + 1;
            $msg = $summaryContext . '----' . PHP_EOL . '# Chunk (' . $number . '/' . count($chunkStrings) . ') of the document to analyse' . PHP_EOL . PHP_EOL . $chunk . $instruction . $userMsg;
            $responseMsg = $this->agentTalkService->executeAgentTalk($agent, ['message' => $msg], null, true);

            if ($responseMsg != 'Not Applicable') {
                $responseParts[] = $responseMsg;
            }
        }

        return implode(PHP_EOL, $responseParts);
    }

    private function getFileLines(string $content): array
    {
        $lines = explode("\n", $content);
        $maxSentencesPerLine = 10;
        $processedLines = [];

        foreach ($lines as $line) {
            $sentences = preg_split('/(?<=[.!?])\s+/', $line, -1, PREG_SPLIT_NO_EMPTY);
            if (count($sentences) > $maxSentencesPerLine) {
                foreach (array_chunk($sentences, $maxSentencesPerLine) as $chunk) {
                    $processedLines[] = implode(' ', $chunk);
                }
            } else {
                $processedLines[] = $line;
            }
        }

        return $processedLines;
    }

    private function truncateMessage(string $msg, int $maxWords = 60000): string
    {
        $words = str_word_count($msg, 1);
        $totalWords = count($words);

        if ($totalWords <= $maxWords) {
            return $msg;
        }

        $firstWords = array_slice($words, 0, (int)($maxWords * 0.25));
        $lastWords  = array_slice($words, -((int)($maxWords * 0.75)));

        return implode(' ', $firstWords) . " [...] " . PHP_EOL . implode(' ', $lastWords);
    }

    private function applyMergeModel(AIAgent $agent): AIAgent
    {
        $model = $this->entityManager
                     ->getRepository(AIModel::class)
                     ->findOneBy(['code' => 'claude_35_sonnet']);
        return $agent->setModel($model);
    }
}