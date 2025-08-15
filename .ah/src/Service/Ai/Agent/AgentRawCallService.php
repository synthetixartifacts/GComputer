<?php

namespace App\Service\Ai\Agent;

use App\Entity\Ai\AIAgent;
use App\Trait\ArrayToolTrait;
use App\Service\Api\ApiClient;
use App\Service\Ai\ModelService;
use App\Service\Ai\Agent\SystemMsgService;

use Psr\Log\LoggerInterface;
use RuntimeException;

class AgentRawCallService
{
    use ArrayToolTrait;

    public function __construct(
        private SystemMsgService $systemMsgService,
        private ModelService $modelService,
        private ApiClient $apiClient,
        private LoggerInterface $logger,
        private LoggerInterface $devLog,
    ) {}

    public function getEndpointUrl($agent) {
        return $agent->getModel()->getProvider()->getUrl() . $agent->getModel()->getEndpoint();
    }

    public function getCallParamsWithValue(AIAgent $agent, string $userMessage, bool $stream = false): array {
        $model  = $agent->getModel();
        $return = $model->getParamsArray();

        $return = $this->replaceKeyByValue($return, '%key%',          $model->getProvider()->getApiSecret($_ENV['ENCRYPTION_KEY']));
        $return = $this->replaceKeyByValue($return, '%modelName%',    $model->getModel());
        $return = $this->replaceKeyByValue($return, '%streamValue%',  $stream);
        $return = $this->replaceKeyByValue($return, '%systemPrompt%', $this->systemMsgService->getSystemMsg($agent));
        $return = $this->replaceKeyByValue($return, '%userMsg%',      $userMessage);

        $return = array_merge(
            $return,
            $agent->getParamsArray()
        );

        return $return;
    }


    /************
    * REAL CALLS
    *************/
    public function talkStream(AIAgent $agent, string $message, callable $callback)
    {
        $params = $this->getCallParamsWithValue(
            $agent,
            $message,
            true
        );

        $this->devLog->info('STREAM PARAMS: ' . json_encode($params));

        // Call API
        $this->apiClient->streamingRequest(
            'POST',
            $this->getEndpointUrl($agent),
            ['json' => $params],
            $callback
        );
    }

    public function talk(AIAgent $agent, string $message): array
    {
        $params = $this->getCallParamsWithValue(
            $agent,
            $message,
            false
        );

        $this->devLog->info('TALK PARAMS: ', $params);

        // Call API
        return $this->apiClient->request(
            'POST',
            $this->getEndpointUrl($agent),
            ['json' => $params],
            false
        );
    }

    public function whisper(AIAgent $agent, string $filePath): array
    {
        if (!is_readable($filePath)) {
            throw new RuntimeException(sprintf('File not readable: %s', $filePath));
        }

        $params = $this->getCallParamsWithValue(
            $agent,
            '',
            false
        );

        // TODO - Create system agent + model that will be used for whisper
        $params['file'] = fopen($filePath, 'r');


        $this->devLog->info('WHISPER PARAMS: ', $params);

        // Call API
        return  $this->apiClient->request(
            'POST',
            $this->getEndpointUrl($agent),
            ['body' => $params],
            false,
        );
    }

    public function vision(AIAgent $agent, string $message, string $base64): array
    {
        $params = $this->getCallParamsWithValue(
            $agent,
            $message,
            false
        );

        // TODO - Create system agent + model that will be used for vision
        $params['messages'] = [
            [
                "role"    => "user",
                "content" => [
                    [
                        "type" => "text",
                        "text" => $message,
                    ],
                    [
                        "type" => "image_url",
                        "image_url" => [
                            "url" => "data:image/jpeg;base64,{$base64}",
                        ]
                    ]
                ]
            ]
        ];

        $this->devLog->info('VISION PARAMS: ', $params);

        // Call API
        return $this->apiClient->request(
            'POST',
            $this->getEndpointUrl($agent),
            ['json' => $params],
            false,
        );
    }


    public function tts(AIAgent $agent, string $message, string $voice): array
    {
        $params = $this->getCallParamsWithValue(
            $agent,
            $message,
            false
        );

        $params['voice'] = $voice;

        $this->devLog->info('TTS  PARAMS: ', $params);

        // Call API
        return $this->apiClient->request(
            'POST',
            $this->getEndpointUrl($agent),
            ['json' => $params],
            true,
        );
    }






    public function getAgentStreamResponseText($agent, $response): ?string
    {
        return $this->getResponseTextFromPaths(
            $response,
            $agent->getModel()->getStreamMessageLocation()
        );
    }

    public function getAgentResponseText($agent, $response): ?string
    {
        return $this->getResponseTextFromPaths(
            $response,
            $agent->getModel()->getMessageLocation()
        );
    }

    private function getResponseTextFromPaths($response, string $location)
    {
        $paths = explode('|', $location);

        try {
            foreach ($paths as $path) {
                $value = $this->extractNestedValue($response, trim($path));
                if (!empty($value)) {
                    return $value;
                }
            }
        } catch (\Exception $e) {
            return '';
        }
    }

    public function createAgentResponse($agent, string $message): array
    {
        return $this->createResponseFromPath(
            $message,
            $agent->getModel()->getStreamMessageLocation()
        );
    }
}
