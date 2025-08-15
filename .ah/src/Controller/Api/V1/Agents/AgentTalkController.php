<?php

namespace App\Controller\Api\V1\Agents;

use App\Controller\Api\V1\Agents\AbstractAgentApiController;
use App\Entity\Ai\AIModel;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\JsonResponse;

#[Route('/api/v1', name: 'api_v1_')]
class AgentTalkController extends AbstractAgentApiController
{
    #[Route('/agent/talk/{agent_code}', name: 'agent_talk', methods: ['POST', 'GET'], priority: 0)]
    public function apiTalk(string $agent_code, Request $request): JsonResponse
    {
        // Validation
        $agent = $this->apiHelperService->validateAgentAccessRequest($agent_code, $request);
        if ($agent instanceof JsonResponse) {
            return $agent;
        }

        // Extract request data
        $data = $this->apiHelperService->extractRequestData($request);

        // Manage discussion
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

        // Up agent
        if (isset($data['up_agent_model'])) {
            $model  = $this->entityManager->getRepository(AIModel::class)->findOneBy(['code' => $data['up_agent_model']]);

            if ($model) {
                $agent->setModel($model);
            }
        }

        return $this->agentTalkService->executeAgentTalk($agent, $data, $discussion);
    }

    #[Route('/agent/stream/{agent_code}', name: 'agent_talk_stream', methods: ['POST', 'GET'], priority: 0)]
    public function apiTalkStream(string $agent_code, Request $request): StreamedResponse|JsonResponse
    {
        // Validation
        $agent = $this->apiHelperService->validateAgentAccessRequest($agent_code, $request);
        if ($agent instanceof JsonResponse) {
            return $agent;
        }

        $data = $this->apiHelperService->extractRequestData($request);

        // Manage discussion
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

        // Up agent
        if (isset($data['up_agent_model'])) {
            $model  = $this->entityManager->getRepository(AIModel::class)->findOneBy(['code' => $data['up_agent_model']]);

            if ($model) {
                $agent->setModel($model);
            }
        }

        return $this->agentTalkService->executeAgentTalkStream($agent, $data, $discussion);
    }






    // TODO Move this in some type of action controller
    // Also add action DRY with whisper / voice / ...
    #[Route('/agent/tts', name: 'tts', methods: ['POST'])]
    public function tts(Request $request): JsonResponse
    {
        // Validate user request
        $user = $this->apiHelperService->validateUserRequest($request);
        if ($user instanceof JsonResponse) {
            return $user;
        }

        $data = $this->apiHelperService->extractRequestData($request);
        return $this->agentTalkService->executeTts($data);
    }
}