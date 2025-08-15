<?php

namespace App\Controller\Api\V1\Agents\Custom;

use App\Controller\Api\V1\Agents\AbstractAgentApiController;
use App\Service\Api\ApiHelperService;
use App\Service\Ai\Agent\AgentTalkService;
use App\Service\File\FileService;
use App\Service\DiscussionService;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\String\UnicodeString;
use Doctrine\ORM\EntityManagerInterface;

#[Route('/api/v1', name: 'api_v1_')]
class GrammarFixerController extends AbstractAgentApiController
{
    public function __construct(
        protected FileService $fileService,
        protected ApiHelperService $apiHelperService,
        protected AgentTalkService $agentTalkService,
        protected DiscussionService $discussionService,
        protected EntityManagerInterface $entityManager,
    ) {
        parent::__construct(
            $apiHelperService,
            $agentTalkService,
            $discussionService,
            $entityManager
        );
    }

    #[Route('/agent/talk/grammar_fixer', name: 'agent_talk_grammar_fixer', methods: ['POST', 'GET'], priority: 1)]
    public function apiTalk(Request $request): JsonResponse
    {
        return $this->apiHelperService->notImplementedYetResponse();
    }


    #[Route('/agent/stream/grammar_fixer', name: 'agent_talk_stream_grammar_fixer', methods: ['POST', 'GET'], priority: 1)]
    public function apiTalkStream(Request $request): StreamedResponse|JsonResponse
    {
        // Validation
        $agent = $this->apiHelperService->validateAgentAccessRequest('grammar_fixer', $request);
        if ($agent instanceof JsonResponse) {
            return $agent;
        }

        // Check if there is a file to parse
        $data = $this->apiHelperService->extractRequestData($request);

        // TODO DRY THIS? - COMBINE WITH ACTION?
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

        // If no file - We just talk
        if (!isset($data['fileIds']) || count($data['fileIds']) <= 0) {
            return $this->agentTalkService->executeAgentTalkStream($agent, $data, $discussion);
        }

        // Get files
        $fileIds = $data['fileIds'];

        if (count($fileIds) > 1) {
            // Return message that we can only translated one document at a time
            return $this->streamForceResponse($agent, 'Sorry, we can only manage one file at a time.', $discussion);
        }

        $translatedFilePath = $this->fileService->fixGrammarDocument($fileIds[0]);

        // Convert server path to public URL
        $relativePath = (new UnicodeString($translatedFilePath))
            ->after('public/')
            ->toString();

        $publicUrl = '/'. $relativePath;

        // Unset file to prevent being concat before
        unset($data['fileIds']);

        // Return file
        $message = sprintf('[Download file](%s)', $publicUrl);
        return $this->streamForceResponse($agent, $message, $discussion);
    }
}