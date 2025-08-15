<?php

namespace App\Service\Ai\Agent;

use App\Entity\Ai\AIAgent;
use App\Service\Ai\Agent\AgentRawCallService;
use App\Service\Ai\Agent\UserMsgService;

class AgentService
{
    public function __construct(
        private AgentRawCallService $rawCall,
        private UserMsgService $userMsgService,
    ) {}

    public function getUserMsg($agent, $userMessage) {
        return $this->userMsgService->getUserMsg($agent, $userMessage);
    }

    public function talkStream(AIAgent $agent, string $message, ?callable $callback = null)
    {
        return $this->rawCall->talkStream(
            $agent,
            $this->getUserMsg($agent, $message),
            $callback
        );
    }

    public function talk(AIAgent $agent, string $message): array
    {
        return $this->rawCall->talk(
            $agent,
            $this->getUserMsg($agent, $message),
        );
    }

    public function whisper(AIAgent $agent, string $filePath): array
    {
        return $this->rawCall->whisper($agent, $filePath);
    }

    public function vision(AIAgent $agent, string $message, string $base64): array
    {
        return $this->rawCall->vision(
            $agent,
            $this->getUserMsg($agent, $message),
            $base64
        );
    }


    public function tts(AIAgent $agent, string $message, string $voice = 'alloy'): array
    {
        return $this->rawCall->tts($agent, $message, $voice);
    }



    // Find "Real" Response data

    public function getAgentStreamResponseText($agent, $response) {
        return $this->rawCall->getAgentStreamResponseText($agent, $response);
    }

    public function getAgentResponseText($agent, $response) {
        return $this->rawCall->getAgentResponseText($agent, $response);
    }

    public function createAgentResponse($agent, string $message) {
        return $this->rawCall->createAgentResponse($agent, $message);
    }
}
