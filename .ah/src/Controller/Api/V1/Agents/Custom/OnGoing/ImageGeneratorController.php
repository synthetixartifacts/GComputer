<?php

namespace App\Controller\Api\V1\Agents\Custom\OnGoing;

use App\Controller\Api\V1\Agents\AbstractAgentApiController;
use App\Service\Api\ApiHelperService;
use App\Service\Ai\Agent\AgentTalkService;
use App\Service\File\FileService;
use App\Service\DiscussionService;
use App\Service\Ai\Agent\AgentRawCallService;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Doctrine\ORM\EntityManagerInterface;

#[Route('/api/v1', name: 'api_v1_')]
class ImageGeneratorController extends AbstractAgentApiController
{
    public function __construct(
        protected AgentRawCallService $rawCall,
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

    #[Route('/agent/talk/together_image', name: 'agent_talk_together_image', methods: ['POST', 'GET'], priority: 1)]
    public function apiTalk(Request $request): JsonResponse
    {
        // Validation
        $agent = $this->apiHelperService->validateAgentAccessRequest('together_image', $request);
        if ($agent instanceof JsonResponse) {
            return $agent;
        }

        // Get request data
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

        return $this->agentTalkService->executeAgentTalk($agent, $data, $discussion);
    }

    #[Route('/agent/stream/together_image', name: 'agent_talk_stream_together_image', methods: ['POST', 'GET'], priority: 1)]
    public function apiTalkStream(Request $request): StreamedResponse|JsonResponse
    {
        // Validation
        $agent = $this->apiHelperService->validateAgentAccessRequest('together_image', $request);
        if ($agent instanceof JsonResponse) {
            return $agent;
        }

        // Get request data
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

        $userMsg = $data['message'] ?? 'Happy cat having fun';
        $formattedPrompt = $userMsg; //$this->formatImagePrompt($userMsg);

        $response = $this->rawCall->talk($agent, $formattedPrompt);
        $urlImage = $this->rawCall->getAgentResponseText($agent, $response);

        $imgMarkdown = sprintf('[img]![Image Created](%s)[</img]', $urlImage);

        return $this->streamForceResponse(
            $agent,
            $imgMarkdown,
            $discussion
        );
    }

    private function formatImagePrompt(string $userRequest): string
    {
        $examples = [
            'A square conceptual image of a business handshake between two human-like figures composed entirely of glowing digital lines, representing technology and connectivity. Data streams flow between their hands and bodies, symbolizing the exchange of information. The background is light gray, clean, and minimalistic to emphasize the futuristic and digital elements of the figures and data streams.',
            'A wide minimalist and vector-style conceptual image focusing on a glowing business handshake between two abstract human-like figures made of clean, geometric digital lines and shapes. The hands are the central focus, connected by simple data streams to emphasize technology and connectivity. The background is light gray, clean, and minimalistic. The text "The Future is Here" is displayed in a modern, sans-serif font below the handshake. The overall design is sleek and futuristic, with a flat, vectorial aesthetic.',
            'Create a photography of a minimalist Provence landscape in pop-art style with floating geometric shapes in vibrant hues while emphasizing the natural beauty of the landscape.',
            'hyper realistic. photograph. desert at night. sun behind the curve with stars, comet and planets. Prismatic geometric glowing monoliths. rectangle glowing with floating neon glass orb. Surreal minimalist. vibrant column colors',
            'Photograph a human and a robot, painting each other faces. Fashion magazine cover. Achieve an editorial aesthetic with minimalism and bold pastel colors. Use a prismatic patterned background to make the image pop',
        ];

        return sprintf(
            "You are an image generator that create fun images based uppon a user prompt. Here are examples of well-structured image descriptions that produce optimal results:\n\nExample 1:\n%s\n\nExample 2:\n%s\n\Now create an image based on this request, following a similar descriptive style and detail level:\n%s",
            $examples[0],
            $examples[1],
            $userRequest
        );
    }
}