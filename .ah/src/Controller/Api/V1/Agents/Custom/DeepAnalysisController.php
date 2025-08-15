<?php

namespace App\Controller\Api\V1\Agents\Custom;

use App\Controller\Api\V1\Agents\AbstractAgentApiController;
use App\Entity\Ai\AIAgent;
use App\Entity\Ai\AIModel;
use App\Entity\Discussion\Discussion;
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
class DeepAnalysisController extends AbstractAgentApiController
{
    // Configurable parameters for document processing
    private const SMALL_DOCUMENT_LINE_THRESHOLD = 30; // If the document is smaller than this, we process it as a small document
    private const MAX_WORDS_TRUNCATE = 100000;        // Maximum words allowed before truncation
    private const MAX_SENTENCES_PER_LINE = 15;        // Number of sentences per line
    private const CHUNK_SIZE = 40;                    // Number of lines per chunk

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

    /**
     * Endpoint for deep analysis agent talk (not implemented).
     *
     * @return JsonResponse Not implemented response.
     */
    #[Route('/agent/talk/deep_analysis', name: 'agent_talk_deep_analysis', methods: ['POST', 'GET'], priority: 1)]
    public function apiTalk(): JsonResponse {
        return $this->apiHelperService->notImplementedYetResponse();
    }

    /**
     * Streamed endpoint for deep document analysis.
     *
     * @param Request $request HTTP request object.
     * @return StreamedResponse|JsonResponse Stream response or JSON error response.
     */
    #[Route('/agent/stream/deep_analysis', name: 'agent_talk_stream_deep_analysis', methods: ['POST', 'GET'], priority: 1)]
    public function apiTalkStream(Request $request): StreamedResponse|JsonResponse
    {
        // Validate access and extract request data
        $agent = $this->apiHelperService->validateAgentAccessRequest('deep_analysis', $request);
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

        // For small documents, build and send a simple message
        if (count($lines) < self::SMALL_DOCUMENT_LINE_THRESHOLD) {
            return $this->smallDocument($agent, $content, $userMsg, $discussion);
        }

        // For large documents
        return $this->largeDocument($agent, $content, $lines, $userMsg, $discussion);
    }

    /**
     * Process small document directly with native agent prompt.
     *
     * @param AIAgent $agent Agent instance to use for talk.
     * @param string $content Document content.
     * @param string $userMsg User custom instructions.
     * @param Discussion|null $discussion Discussion entity context.
     * @return StreamedResponse Streamed agent talk response.
     */
    private function smallDocument($agent, $content, $userMsg, $discussion) {
        $message = $content;
        if (!empty(trim($userMsg))) {
            $message .= "\n\n" . $userMsg;
        }

        $agent = $this->applyMergeModel($agent);
        return $this->agentTalkService->executeAgentTalkStream($agent, ['message' => $message], $discussion);
    }

    /**
     * Process large document by chunks, with no assumptions about structure.
     *
     * @param AIAgent $agent Agent instance.
     * @param string $content Full document content.
     * @param array $lines Array of processed document lines.
     * @param string $userMsg User custom instructions.
     * @param Discussion|null $discussion Discussion entity context.
     * @return StreamedResponse Streamed response of aggregated analysis.
     */
    private function largeDocument($agent, $content, $lines, $userMsg, $discussion)
    {
        // First pass to get an initial analysis of the overall document
        $initialMsg = $this->truncateMessage($content);
        if (!empty(trim($userMsg))) {
            $initialMsg .= "\n\n" . $userMsg;
        }

        // Get initial analysis from the agent
        $initialAnalysis = $this->agentTalkService->executeAgentTalk($agent, ['message' => $initialMsg], null, true);

        // Process the document in chunks to get detailed analysis
        $detailedAnalysis = $this->processDocumentChunks($lines, $agent, $userMsg, $initialAnalysis);

        // Combine the analyses
        $finalMsg = $initialAnalysis;
        if (!empty($detailedAnalysis)) {
            $finalMsg .= PHP_EOL . PHP_EOL . "## Detailed Analysis" . PHP_EOL . $detailedAnalysis;
        }

        // Final pass to integrate user instructions if provided
        if (!empty(trim($userMsg))) {
            $combinedMsg = $finalMsg . "\n\n" . $userMsg;
            $finalMsg = $this->agentTalkService->executeAgentTalk($agent, ['message' => $combinedMsg], null, true);
        }

        return $this->streamForceResponse($agent, $finalMsg, $discussion);
    }

    /**
     * Process document in chunks for comprehensive analysis.
     *
     * @param array $lines Array of processed document lines.
     * @param AIAgent $agent Agent instance for LLM execution.
     * @param string $userMsg Additional user instruction.
     * @param string $initialAnalysis Initial analysis for context.
     * @return string Combined analysis from all chunks.
     */
    private function processDocumentChunks($lines, $agent, $userMsg, $initialAnalysis = '') {
        $chunks = array_chunk($lines, self::CHUNK_SIZE);
        $chunkStrings = array_map(fn($chunk) => implode(PHP_EOL, $chunk), $chunks);
        $responseParts = [];

        // Don't process all chunks if there's only one
        if (count($chunks) === 1) {
            return '';
        }

        foreach ($chunkStrings as $index => $chunk) {
            $number = $index + 1;
            $totalChunks = count($chunkStrings);

            // Build the message for this chunk
            $msg = "Analyzing document chunk {$number} of {$totalChunks}\n\n";
            $msg .= $chunk;

            if (!empty($userMsg)) {
                $msg .= "\n\n" . $userMsg;
            }

            $responseMsg = $this->agentTalkService->executeAgentTalk($agent, ['message' => $msg], null, true);

            if (!empty($responseMsg) && $responseMsg !== "No relevant content") {
                $responseParts[] = $responseMsg;
            }
        }

        // If we have multiple parts, combine them
        if (count($responseParts) > 0) {
            // Final consolidation step if we have multiple chunks
            if (count($responseParts) > 1) {
                $combinedResponses = implode("\n\n---\n\n", $responseParts);
                $consolidationMsg = "Here are analyses from different parts of the document. Please consolidate them into a cohesive analysis:\n\n" . $combinedResponses;

                if (!empty($userMsg)) {
                    $consolidationMsg .= "\n\n" . $userMsg;
                }

                return $this->agentTalkService->executeAgentTalk($agent, ['message' => $consolidationMsg], null, true);
            } else {
                return $responseParts[0];
            }
        }

        return '';
    }

    /**
     * Splits content into manageable lines while ensuring sentence integrity.
     *
     * @param string $content The text content to be processed
     * @return array An array of processed lines
     */
    private function getFileLines(string $content): array
    {
        $lines = explode("\n", $content);
        $processedLines = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) {
                continue;
            }

            $sentences = preg_split('/(?<=[.!?])\s+/', $line, -1, PREG_SPLIT_NO_EMPTY);
            if (count($sentences) > self::MAX_SENTENCES_PER_LINE) {
                foreach (array_chunk($sentences, self::MAX_SENTENCES_PER_LINE) as $chunk) {
                    $processedLine = trim(implode(' ', $chunk));
                    if (!empty($processedLine)) {
                        $processedLines[] = $processedLine;
                    }
                }
            } else {
                $processedLines[] = $line;
            }
        }

        return $processedLines;
    }

    /**
     * Truncate a message by keeping a percentage of first and last words.
     *
     * @param string $msg Original message content.
     * @param int $maxWords Maximum number of words allowed.
     * @return string Truncated message with ellipsis insert.
     */
    private function truncateMessage(string $msg, int $maxWords = self::MAX_WORDS_TRUNCATE): string
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

    /**
     * Switch the agent's model to an appropriate model for deep analysis.
     *
     * @param AIAgent $agent Agent instance whose model is to be switched.
     * @return AIAgent Agent instance with updated model.
     */
    private function applyMergeModel(AIAgent $agent): AIAgent
    {
        $model = $this->entityManager
                      ->getRepository(AIModel::class)
                      ->findOneBy(['code' => 'claude_35_sonnet']);

        // Fallback to other models if preferred one isn't available
        if (!$model) {
            $model = $this->entityManager
                         ->getRepository(AIModel::class)
                         ->findOneBy(['code' => 'gpt_4.1']);
        }

        return $agent->setModel($model);
    }
}