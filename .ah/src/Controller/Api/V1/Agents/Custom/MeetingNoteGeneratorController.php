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
class MeetingNoteGeneratorController extends AbstractAgentApiController
{
    private const SECTION_TRANSLATIONS = [
        'fr' => [
            'Key Points'       => 'Points Clés',
            'Action Items'     => 'Points d\'Action',
            'Pending Elements' => 'Éléments en Attente',
            'Next Steps'       => 'Prochaines Étapes'
        ]
    ];

    private const SMALL_TRANSCRIPT_LINE_THRESHOLD = 35; // If the transcript is smaller than this, we process it as a small transcript
    private const MAX_WORDS_TRUNCATE = 100000; // If the transcript is larger than this, we truncate it
    private const GET_LANGUAGE_MAX_WORDS = 2000; // If the transcript is larger than this, we truncate it to get the language
    private const MAX_SENTENCES_PER_LINE = 15; // Number of sentences per line
    private const CHUNK_SIZE = 50; // Number of lines per chunk

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
     * Endpoint for agent talk meetings (not implemented yet).
     *
     * @return JsonResponse Not implemented response.
     */
    #[Route('/agent/talk/meeting_note_generator', name: 'agent_talk_meeting', methods: ['POST', 'GET'], priority: 1)]
    public function apiTalk(): JsonResponse {
        return $this->apiHelperService->notImplementedYetResponse();
    }

    /**
     * Streamed endpoint for meeting note generation agent talk.
     *
     * Validates agent access, processes file inputs for meeting transcripts,
     * and delegates to smallTranscript or largeTranscript for processing.
     *
     * @param Request $request HTTP request object.
     * @return StreamedResponse|JsonResponse Stream response or JSON error response.
     */
    #[Route('/agent/stream/meeting_note_generator', name: 'agent_talk_stream_meeting', methods: ['POST', 'GET'], priority: 1)]
    public function apiTalkStream(Request $request): StreamedResponse|JsonResponse
    {
        // Validate access and extract request data
        $agent = $this->apiHelperService->validateAgentAccessRequest('meeting_note_generator', $request);
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

        $language = $this->getLanguage($agent, $content);

        // SMALL transcripts, build and send a simple message
        if (count($lines) < self::SMALL_TRANSCRIPT_LINE_THRESHOLD) {
            return $this->smallTranscript($agent, $content, $userMsg, $language, $discussion);
        }

        // LARGE transcripts
        return $this->largeTranscript($agent, $content, $lines, $userMsg, $language, $discussion);
    }

    /**
     * Process small transcript directly with native agent prompt.
     *
     * @param AIAgent $agent Agent instance to use for talk.
     * @param string $content Transcript content.
     * @param string $userMsg User custom instructions.
     * @param string $language Language of transcript.
     * @param Discussion|null $discussion Discussion entity context.
     * @return StreamedResponse Streamed agent talk response.
     */
    private function smallTranscript($agent, $content, $userMsg, $language, $discussion) {
        $content .= $userMsg;
        $agent   = $this->applyMergeModel($agent);

        return $this->agentTalkService->executeAgentTalkStream($agent, ['message' => $content], $discussion);
    }

    /**
     * Process large transcript by chunks: initial summary, extract sections, merge and stream response.
     *
     * @param AIAgent $agent Agent instance.
     * @param string $content Full transcript content.
     * @param array $lines Array of processed transcript lines.
     * @param string $userMsg User custom instructions.
     * @param string $language Language determined for transcript.
     * @param Discussion|null $discussion Discussion entity context.
     * @return StreamedResponse Streamed response of aggregated meeting notes.
     */
    private function largeTranscript($agent, $content, $lines, $userMsg, $language, $discussion)
    {
        // We get the language, title and first summary
        $startInstruction = <<<INSTRUCTION
        <custom_instruction>
        You will only return the title, data, participants and summary for the transcript. Nothing else following the structure you were given.
        Answer in $language.
        </custom_instruction>
        INSTRUCTION;

        $msg            = $this->truncateMessage($content) . $startInstruction . $userMsg;
        $introStructure = $this->agentTalkService->executeAgentTalk($agent, ['message' => $msg], null, true);
        $summary        = $this->extractSummary($introStructure);
        $finalMsg       = $introStructure;

        if (strtolower($language) === 'french') {
            // Translate initial section titles to French
            $replacements = [
                '### Title'        => '### Titre',
                '### Data'         => '### Données',
                '### Participants' => '### Participants',
                '### Summary'      => '### Résumé',
            ];
            $finalMsg = str_replace(array_keys($replacements), array_values($replacements), $finalMsg);
        }

        // Now we go through Key Points / Action Items / Pending Elements / Next Steps
        // One at a time
        $loopFor = ['Key Points', 'Action Items', 'Pending Elements', 'Next Steps'];
        $loopInstruction = <<<INSTRUCTION
        \n\n
        ----
        <custom_instruction>
        You will only return the %s. Nothing else, not even the section title.
        If there is none, just return "None", that is acceptable.
        Answer in $language.
        </custom_instruction>
        INSTRUCTION;
        $summaryContext = ($summary) ? '<context>We are currently analyzing a transcript chunk by chunk due to its size. Here is the overall summary so you can better understand the global context to do your job:\n\n' . $summary . '\n</context>\n\n' : '';

        foreach ($loopFor as $loop) {
            $instruction = sprintf($loopInstruction, $loop);
            $msg         = $this->processScriptByChunksForInstruction($summaryContext, $instruction, $lines, $agent, $userMsg);

            if (empty($msg) || $msg === 'Not Applicable') {
                continue;
            }

            if ($loop === 'Action Items') {
                $msg = $this->mergeActionItems($agent, $msg);
            }

            $sectionTitle = (strtolower($language) === 'french') && isset(self::SECTION_TRANSLATIONS['fr'][$loop])
            ? self::SECTION_TRANSLATIONS['fr'][$loop]
            : $loop;

            $finalMsg .= PHP_EOL . "### " . $sectionTitle . PHP_EOL . $msg;
        }

        // If user instruction
        if ($userMsg) {
            // We send it to an llm to only focus on the user instruction
            $msg = '# Context \n You will received the created output we did but, this time the user is also giving specific instruction that we must focus on. You will return the complete output needed in this context.\n-----\n'. $finalMsg . '\n\n' . $userMsg;
            $finalMsg = $this->agentTalkService->executeAgentTalk($agent, ['message' => $msg], null, true);
        }

        return $this->streamForceResponse($agent, $finalMsg, $discussion);
    }

    /**
     * Extract the summary section from generated structure content.
     *
     * @param string $content Generated content containing multiple sections.
     * @return string|null Trimmed summary text or null if not found.
     */
    private function extractSummary(string $content): ?string
    {
        if (empty($content)) {
            return null;
        }

        $summaryContent = strstr($content, '### Summary');
        if ($summaryContent === false) {
            return null;
        }

        // Remove the "### Summary" header
        $summaryContent = str_replace('### Summary', '', $summaryContent);

        // If there are other sections after, get only until the next ###
        if (($nextSection = strpos($summaryContent, '###')) !== false) {
            $summaryContent = substr($summaryContent, 0, $nextSection);
        }

        return trim($summaryContent);
    }

    /**
     * Process transcript lines chunk by chunk for a specific instruction.
     *
     * @param string $summaryContext Context string containing overall summary.
     * @param string $instruction Custom instruction to apply to each chunk.
     * @param array $lines Array of processed transcript lines.
     * @param AIAgent $agent Agent instance for LLM execution.
     * @param string $userInstruction Additional user instruction.
     * @return string Concatenated responses for each chunk.
     */
    private function processScriptByChunksForInstruction($summaryContext, $instruction, $lines, $agent, $userInstruction) {
        $chunks        = array_chunk($lines, self::CHUNK_SIZE);
        $chunkStrings  = array_map(fn($chunk) => implode("\n", $chunk), $chunks);
        $responseParts = [];

        foreach ($chunkStrings as $index => $chunk) {
            $number = $index + 1;
            $msg = $summaryContext . '----\n# Chunk (' . $number . '/' . count($chunkStrings) . ') of the transcript to analyse\n\n' . $chunk . $instruction . $userInstruction;
            $responseMsg = $this->agentTalkService->executeAgentTalk($agent, ['message' => $msg], null, true);

            if ($responseMsg != 'None') {
                $responseParts[] = $responseMsg;
            }
        }

        // concat all $responseParts into on string
        return implode("\n", $responseParts);
    }

    /**
     * Merge multiple action items responses into a consolidated list per user.
     *
     * @param AIAgent $agent Agent instance.
     * @param string $msg Combined action items text from chunks.
     * @return string Merged action items list.
     */
    private function mergeActionItems($agent, $msg) {
        // We get the language, title and first summary
        $context = '## Context \nWe have parse the long transcript and created the all the actions items. Here is the list of them:\n\n';
        $instruction = <<<INSTRUCTION
        <custom_instruction>
        Your job for this turn is to merge all the action items into a single list per user. Do not include any other text. Keep all action items, just merge them under their respective user. Return nothing else than the list, not even the title of the section. Keep the language of the actions items the same.
        </custom_instruction>
        INSTRUCTION;

        $msg = $context . $msg . $instruction;

        return $this->agentTalkService->executeAgentTalk($agent, ['message' => $msg], null, true);
    }

    /**
     * Determine the language of a transcript.
     *
     * @param AIAgent $agent Agent instance for language detection.
     * @param string $content Transcript content to analyze.
     * @return string Detected language, either 'English' or 'French'.
     */
    private function getLanguage($agent, $content) {
        // We get the language, title and first summary
        $instruction = <<<INSTRUCTION
        <custom_instruction>
        We first need to know the language of the transcript. You will only return the language. Nothing else, not even the section title.
        You either return "English" or "French" and only that.
        </custom_instruction>
        INSTRUCTION;

        $msg = $this->truncateMessage($content, self::GET_LANGUAGE_MAX_WORDS) . $instruction;
        return $this->agentTalkService->executeAgentTalk($agent, ['message' => $msg], null, true);
    }

    /**
     * Splits content into manageable lines while ensuring sentence integrity.
     *
     * This function processes a text content by:
     * 1. Breaking it into lines
     * 2. Analyzing each line for sentence count
     * 3. If a line contains more than the maximum allowed sentences, it splits it into chunks
     *
     * @param string $content The text content to be processed
     * @param int $maxSentencesPerLine Maximum number of sentences allowed per line (default: 10)
     *
     * @return array An array of processed lines, each containing at most $maxSentencesPerLine sentences
     */
    private function getFileLines(string $content): array
    {
        $lines = explode("\n", $content);
        $maxSentencesPerLine = self::MAX_SENTENCES_PER_LINE;
        $processedLines = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) {
                continue;
            }

            $sentences = preg_split('/(?<=[.!?])\s+/', $line, -1, PREG_SPLIT_NO_EMPTY);
            if (count($sentences) > $maxSentencesPerLine) {
                foreach (array_chunk($sentences, $maxSentencesPerLine) as $chunk) {
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
        $words = str_word_count($msg, 1); // Split into array of words
        $totalWords = count($words);

        if ($totalWords <= $maxWords) {
            return $msg;
        }

        $firstWords = array_slice($words, 0, (int)($maxWords * 0.25));  // Take ~25% from start
        $lastWords  = array_slice($words, -((int)($maxWords * 0.75)));  // Take ~75% from end

        return implode(' ', $firstWords) . " [...] " . PHP_EOL . implode(' ', $lastWords);
    }

    /**
     * Switch the agent's model to the merge model version.
     *
     * @param AIAgent $agent Agent instance whose model is to be switched.
     * @return AIAgent Agent instance with updated model.
     */
    private function applyMergeModel(AIAgent $agent): AIAgent
    {
        $model = $this->entityManager
                      ->getRepository(AIModel::class)
                      ->findOneBy(['code' => 'gpt_4.1']);
        return $agent->setModel($model);
    }
}
