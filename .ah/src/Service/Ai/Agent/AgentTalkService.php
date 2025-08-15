<?php

declare(strict_types=1);

namespace App\Service\Ai\Agent;

use App\Entity\Ai\AIAgent;
use App\Entity\Ai\AIModel;
use App\Entity\Discussion\Discussion;
use App\Repository\Ai\AgentRepository;
use App\Repository\AdminSettingsRepository;
use App\Service\Ai\Agent\AgentService;
use App\Service\Api\ApiHelperService;
use App\Service\File\FileEntityService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * This service handles all "talk", "vision", and "whisper" logic for AIAgent.
 */
class AgentTalkService
{
    public const MAI_USER_PREFIX       = 'mai_user_';
    public const MAI_DEFAULT_CODE      = 'mai_default';
    public const DEFAULT_VISION_MODEL  = 'default_vision_agent_code';
    public const DEFAULT_WHISPER_MODEL = 'default_whisper_agent_code';

    // TODO - set this as config
    public const FALLBACK_MODELS = [
        'claude_35_sonnet',
        'gpt_4o',
    ];

    public const TEST_DEFAULT_MSG = 'what is the crossrefence feature';

    public function __construct(
        private AgentRepository $agentRepository,
        private AgentService $agentService,
        private FileEntityService $fileEntityService,
        private ApiHelperService $apiHelperService,
        private EntityManagerInterface $entityManager,
        private AdminSettingsRepository $adminSettingsRepository,
        private LoggerInterface $ciaRequestLogger,
        private LoggerInterface $apiRequestLogger,
        private ?array $fallbackModels = null
    ) {
        // Initialize fallback models using admin settings if not provided.
        $modelRepo = $this->entityManager->getRepository(AIModel::class);

        $this->fallbackModels = $fallbackModels ?? array_map(
            function (string $code) use ($modelRepo): ?AIModel {
                $setting = $this->adminSettingsRepository->getSetting($code) ?? $code;
                return $modelRepo->findOneBy(['code' => $setting]);
            },
            self::FALLBACK_MODELS
        );
    }

    /* ======================================================================
     * Agent Preparation Helpers
     * ====================================================================== */

    /**
     * Manages MAI agent configuration by applying mai_default agent settings.
     */
    private function manageMaiAgent(AIAgent $agent): AIAgent
    {
        $maiDefaultAgent = $this->agentRepository->findLatestByCode(self::MAI_DEFAULT_CODE);

        if ($maiDefaultAgent === null) {
            return $agent;
        }

        // Apply mai_default agent configuration
        if ($maiDefaultAgent->getModel() !== null) {
            $agent->setModel($maiDefaultAgent->getModel());
        }

        // Copy system prompt from mai_default agent
        if ($maiDefaultAgent->getSystemPrompt() !== null) {
            $agent->setSystemPrompt($maiDefaultAgent->getSystemPrompt());
        }

        // Copy memory from mai_default agent
        if ($maiDefaultAgent->getMemory() !== null) {
            $agent->setMemory($maiDefaultAgent->getMemory());
        }

        // Copy actions from mai_default agent
        if ($maiDefaultAgent->getActions() !== null) {
            foreach ($maiDefaultAgent->getActions() as $action) {
                $agent->addAction($action);
            }
        }

        // Copy custom instructions from mai_default agent

        // Copy configuration from mai_default agent
        if ($maiDefaultAgent->getConfiguration() !== null) {
            $agent->setConfiguration($maiDefaultAgent->getConfiguration());
        }

        return $agent;
    }

    /**
     * Ensures that a MAI-based agent always has the default MAI model.
     */
    private function getAgent(AIAgent $agent): AIAgent
    {
        if (str_starts_with($agent->getCode(), self::MAI_USER_PREFIX)) {
            return $this->manageMaiAgent($agent);
        }

        return $agent;
    }

    /**
     * Returns the fallback models, excluding the agent's current model.
     *
     * @return AIModel[]
     */
    private function getFallbackModelsExcludingCurrent(AIAgent $agent): array
    {
        return array_values(array_filter(
            $this->fallbackModels ?? [],
            static function (?AIModel $model) use ($agent): bool {
                return $model !== null && $model->getId() !== $agent->getModel()?->getId();
            }
        ));
    }

    /* ======================================================================
     * Agent Talk (Chat) Methods
     * ====================================================================== */

    /**
     * Executes a talk request on the given agent with optional fallback logic.
     *
     * @param AIAgent $agent
     * @param array   $data
     * @param bool    $answerOnly If true, returns only the agent's response text
     *
     * @return string|JsonResponse
     */
    public function executeAgentTalk(
        AIAgent $agent,
        array $data = [],
        Discussion|null $discussion = null,
        bool $answerOnly = false
    ): string|JsonResponse
    {
        // Ensure agent is correctly configured (e.g. set MAI model if needed)
        $agent = $this->getAgent($agent);

        // Prepare the user message (optionally merging file contents)
        $userMsg = $this->formatUserMsg($data);

        // Send the message to the agent
        $response = $this->agentService->talk($agent, $userMsg);

        // If the response is not OK, try fallback models
        $fallbackModels = $this->getFallbackModelsExcludingCurrent($agent);
        while (($response['statusCode'] ?? 500) !== 200 && count($fallbackModels) > 0) {
            $agent->setModel(array_shift($fallbackModels));
            $response = $this->agentService->talk($agent, $userMsg);
        }

        $statusCode = $response['statusCode'] ?? 500;

        // Log warning if this is the final error (no more fallbacks)
        $logger = $this->apiRequestLogger;
        if ($statusCode !== 200) {
            $logger->warning('Agent talk failed with non-200 status code', [
                'statusCode' => $statusCode,
                'agentId' => $agent->getId(),
                'response' => $response,
            ]);
        }

        $responseText = $this->agentService->getAgentResponseText($agent, $response);
        if ($responseText === null) {
            $logger->error('Agent response text is null', [
                'agentId' => $agent->getId(),
                'response' => $response,
            ]);
        }

        // Return either plain text or a full JSON response
        if ($answerOnly) {
            return $responseText ?? '';
        }

        return $this->apiHelperService->jsonResponse(
            $this->createReturnData(
                agent       : $agent,
                data        : $data,
                userMsg     : $userMsg,
                response    : $response,
                discussion  : $discussion,
                responseText: $responseText ?? '',
                status     : $statusCode,
                message    : $statusCode === 200
                    ? 'Talk To Agent'
                    : 'Fail - Talk To Agent'
            )
        );
    }

    /**
     * Streams output from an agent talk request using Server-Sent Events (SSE).
     *
     * @param AIAgent $agent
     * @param array   $data
     * @param bool    $answerOnly
     *
     * @return StreamedResponse
     */
    public function executeAgentTalkStream(
        AIAgent $agent,
        array $data,
        Discussion|null $discussion = null,
        bool $answerOnly = false,
    ): StreamedResponse {
        $agent = $this->getAgent($agent);
        $logger = $this->apiRequestLogger;

        return $this->createStreamResponse(function () use ($agent, $data, $discussion, $answerOnly, $logger): void {
            $userMsg = $this->formatUserMsg($data);
            $fallbackModels = $this->getFallbackModelsExcludingCurrent($agent);

            $executeStream = function () use (
                $agent,
                $data,
                $discussion,
                $userMsg,
                $answerOnly,
                $logger,
                &$fallbackModels,
                &$executeStream
            ): void {
                $this->agentService->talkStream($agent, $userMsg, function (array $chunk) use (
                    $agent,
                    $data,
                    $discussion,
                    $userMsg,
                    $answerOnly,
                    $logger,
                    &$fallbackModels,
                    $executeStream
                ): array {
                    $statusCode = $chunk['statusCode'] ?? 500;

                    // If an error occurred and we have fallback models, switch to next model without sending data
                    if ($statusCode !== 200 && count($fallbackModels) > 0) {
                        $agent->setModel(array_shift($fallbackModels));

                        // Clear output buffers before retrying
                        while (ob_get_level() > 0) {
                            ob_end_flush();
                        }
                        flush();

                        $executeStream();
                        return [];
                    }

                    // Log warning if this is the final error (no more fallbacks)
                    if ($statusCode !== 200) {
                        $logger->warning(sprintf('Chunk received as error: %s', json_encode($chunk)));
                    }

                    // Only process and send data if status is 200 or we have no more fallbacks
                    if ($statusCode === 200 || count($fallbackModels) === 0) {
                        $streamData = $answerOnly
                            ? $this->agentService->getAgentResponseText($agent, $chunk)
                            : $this->createReturnData(
                                agent       : $agent,
                                data        : $data,
                                discussion  : $discussion,
                                userMsg     : $userMsg,
                                response    : $chunk,
                                responseText: $this->agentService->getAgentStreamResponseText($agent, $chunk) ?? '',
                                status      : $statusCode,
                                message     : $statusCode === 200
                                    ? 'Stream Talk To Agent'
                                    : 'Stream Talk To Agent Failed - All fallbacks exhausted'
                            );

                        $dataToStream = is_array($streamData) ? $streamData : ['data' => $streamData];
                        $this->streamData($dataToStream);

                        return $dataToStream;
                    }

                    return [];
                });
            };

            $executeStream();
        });
    }

    /* ======================================================================
     * Whisper, Vision, and TTS Methods
     * ====================================================================== */

    /**
     * Executes a whisper request (audio transcription).
     *
     * @param array $data
     * @param bool  $answerOnly If true, returns only the transcribed text
     *
     * @return string|JsonResponse
     */
    public function executeAgentWhisper(
        array $data,
        bool $answerOnly = false
    ): string|JsonResponse
    {
        $whisperCode = $this->adminSettingsRepository->getSetting(self::DEFAULT_WHISPER_MODEL);
        $agent = $this->agentRepository->findLatestByCode($whisperCode);

        $filePath = $data['filePath'] ?? '';
        $response = $this->agentService->whisper($agent, $filePath);

        if ($answerOnly) {
            return $this->agentService->getAgentResponseText($agent, $response);
        }

        return $this->apiHelperService->jsonResponse(
            $this->createReturnData(
                agent       : $agent,
                data        : $data,
                discussion  : null,
                userMsg     : '',
                response    : $response,
                responseText: $this->agentService->getAgentResponseText($agent, $response) ?? '',
                status      : $response['statusCode'],
                message     : $response['statusCode'] === 200
                    ? 'Whisper To Agent'
                    : 'Fail - Whisper To Agent'
            )
        );
    }

    /**
     * Executes a vision request (image recognition or description).
     *
     * @param array $data
     * @param bool  $answerOnly If true, returns only the description text
     *
     * @return string|JsonResponse
     */
    public function executeAgentVision(
        array $data,
        bool $answerOnly = false
        ): string|JsonResponse
    {
        $visionAgentCode = $this->adminSettingsRepository->getSetting(self::DEFAULT_VISION_MODEL);
        $agent = $this->agentRepository->findLatestByCode($visionAgentCode);

        $base64 = $data['base64'] ?? '';
        $message = $data['message'] ?? 'Describe this image precisely with all the details you can find.';
        $message .= 'Now go and only return your description of the image based on the user message / task, nothing else. Do not include any other text or comments.';

        $response = $this->agentService->vision($agent, $message, $base64);

        if ($answerOnly) {
            return $this->agentService->getAgentResponseText($agent, $response);
        }

        return $this->apiHelperService->jsonResponse(
            $this->createReturnData(
                agent       : $agent,
                data        : $data,
                discussion  : null,
                userMsg     : '',
                response    : $response,
                responseText: $this->agentService->getAgentResponseText($agent, $response) ?? '',
                status      : $response['statusCode'],
                message     : $response['statusCode'] === 200
                    ? 'Vision To Agent'
                    : 'Vision - Talk To Agent'
            )
        );
    }

    /**
     * Executes a TTS (text-to-speech) request.
     *
     * @param array $data
     * @param bool  $answerOnly If true, returns only the TTS response text
     *
     * @return string|JsonResponse
     */
    public function executeTts(
        array $data,
        bool $answerOnly = false
    ): string|JsonResponse
    {
        // TODO: Use appropriate TTS model code/configuration instead of default vision model code.
        $ttsAgentCode = $this->adminSettingsRepository->getSetting(self::DEFAULT_VISION_MODEL);
        $agent = $this->agentRepository->findLatestByCode('tts_oai');

        $message = $data['message'] ?? '';
        $voice = $data['voice'] ?? 'alloy';

        $response = $this->agentService->tts($agent, '. . ' . $message, $voice);

        if ($answerOnly) {
            return $this->agentService->getAgentResponseText($agent, $response);
        }

        // TODO - Use default return function/format createReturnData
        return $this->apiHelperService->jsonResponse([
            'message' => 'TTS To Agent',
            'agent'   => $agent->toArray(),
            'call'    => [
                'params'       => $data,
                // The response text is encoded in base64.
                'responseText' => base64_encode($this->agentService->getAgentResponseText($agent, $response)),
            ],
        ], $response['statusCode'] ?? 200);
    }

    /* ======================================================================
     * Utility Methods
     * ====================================================================== */

    /**
     * Creates a StreamedResponse with Server-Sent Events (SSE) headers.
     *
     * @param callable $callback
     *
     * @return StreamedResponse
     */
    public function createStreamResponse(callable $callback): StreamedResponse
    {
        $response = new StreamedResponse();
        $response->headers->set('X-Accel-Buffering', 'no');
        $response->headers->set('Content-Type', 'text/event-stream');
        $response->setCallback($callback);

        return $response;
    }

    /**
     * Outputs data in an SSE-friendly format.
     *
     * @param array $data
     */
    public function streamData(array $data): void
    {
        $json = json_encode($data, JSON_UNESCAPED_UNICODE);
        echo "data: {$json}\n\n";
        flush();
    }

    /**
     * Creates structured data for an SSE event.
     *
     * @param AIAgent $agent
     * @param array   $data
     * @param string  $userMsg
     * @param array   $response
     * @param string  $responseText
     * @param int     $status
     * @param string  $message
     *
     * @return array
     */
    public function createReturnData(
        AIAgent $agent,
        array $data,
        Discussion|null $discussion,
        string $userMsg,
        array $response,
        string $responseText,
        int $status = 200,
        string $message = 'Stream Talk To Agent'
    ): array {
        return [
            'status'  => $status,
            'message' => $message,
            'agent'   => $agent->toArray(),
            'call'    => [
                'params'       => $data,
                'discussion'   => $discussion ? $discussion->toArray() : null,
                'userMsg'      => $userMsg,
                'response'     => json_encode($response),
                'responseText' => $responseText,
            ],
        ];
    }

    /**
     * Merges file content with the user message if needed.
     *
     * @param array $data
     *
     * @return string
     */
    public function formatUserMsg(array $data): string
    {
        $userMsg    = $data['message'] ?? self::TEST_DEFAULT_MSG;
        $fileIds    = $data['fileIds'] ?? [];
        $hasUserMsg = !empty($data['message']);

        return $this->fileEntityService->getFilesContentMsgByIdsForUserMsg($fileIds, !$hasUserMsg) . $userMsg;
    }
}
