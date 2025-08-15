<?php

namespace App\Controller\Api\V1;

use App\Controller\Api\V1\Agents\AbstractAgentApiController;
use App\Entity\Discussion\Discussion;
use App\Entity\Discussion\Message;
use App\Entity\File;
use App\Service\Api\ApiHelperService;
use App\Service\Ai\Agent\AgentTalkService;
use App\Repository\DiscussionRepository;
use App\Service\DiscussionService;
use App\Repository\Ai\AgentRepository;
use App\Service\File\FileEntityService;

use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpFoundation\HeaderUtils;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

#[Route('/api/v1', name: 'api_v1_')]
class DiscussionApiController extends AbstractAgentApiController
{
    public function __construct(
        protected Security $security,
        protected DiscussionRepository $discussionRepository,
        protected AgentRepository $agentRepository,
        protected ApiHelperService $apiHelperService,
        protected AgentTalkService $agentTalkService,
        protected DiscussionService $discussionService,
        protected EntityManagerInterface $entityManager,
        protected FileEntityService $fileEntityService,
    ) {
        parent::__construct(
            $apiHelperService,
            $agentTalkService,
            $discussionService,
            $entityManager
        );
    }

    #[Route('/discussion/one/{key}', name: 'discussion_one', methods: ['GET'])]
    public function oneDiscussions(string $key, Request $request): JsonResponse
    {
        // Validate user request
        $user = $this->apiHelperService->validateUserRequest($request);
        if ($user instanceof JsonResponse) {
            return $user;
        }

        $discussion = $this->discussionRepository->findByKeyAndUser($key, $user->getId());

        return $this->apiHelperService->jsonResponse([
            'message'  => 'Discussions',
            'response' => $discussion->toArray(true)
        ]);
    }

    #[Route('/discussion/complete', name: 'discussion_complete', methods: ['GET'])]
    public function completeDiscussions(Request $request): JsonResponse
    {
        // Validate user request
        $user = $this->apiHelperService->validateUserRequest($request);
        if ($user instanceof JsonResponse) {
            return $user;
        }

        $discussions = $this->discussionRepository->findByUser($user);

        return $this->apiHelperService->jsonResponse([
            'message'  => 'List of user discussions',
            'response' => array_map(fn($discussion) => $discussion->toArray(), $discussions)
        ]);
    }

    // List of the last 40 discussions
    #[Route('/discussion/last', name: 'discussion_list', methods: ['GET'])]
    public function lastDiscussions(Request $request): JsonResponse
    {
        // Validate user request
        $user = $this->apiHelperService->validateUserRequest($request);
        if ($user instanceof JsonResponse) {
            return $user;
        }

        $discussions = $this->discussionRepository->findLastByUser($user);

        return $this->apiHelperService->jsonResponse([
            'message'  => 'List of user discussions',
            'response' => array_map(fn($discussion) => $discussion->toArray(), $discussions)
        ]);
    }

    #[Route('/discussion/add-message', name: 'discussion_add_message', methods: ['POST'])]
    public function addMessage(Request $request): JsonResponse
    {
        $data = $this->apiHelperService->extractRequestData($request);

        // Validation
        $agent = $this->apiHelperService->validateAgentAccessRequest($data['agentCode'] ?? null, $request);
        if ($agent instanceof JsonResponse) {
            return $agent;
        }

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

        // Manage content
        $messages = $data['messages'] ?? [];
        foreach ($messages as $message) {
            $newMessage = new Message();
            $newMessage->setRole($message['role']);
            $newMessage->setContent($message['msg']);
            $newMessage->setDiscussion($discussion);

            $files = $message['files'];

            foreach($files as $file) {
                $fileEntity = $this->entityManager->getRepository(File::class)->find($file['id']);
                $newMessage->addFile($fileEntity);
            }

            $this->entityManager->persist($newMessage);
            $this->entityManager->flush();
        }

        return $this->apiHelperService->jsonResponse([
            'message'  => 'Message added successfully',
            'response' => $discussion->toArray()
        ]);
    }

    #[Route('/discussion/update-title', name: 'discussion_update_title', methods: ['POST'])]
    public function updateTitle(Request $request, LoggerInterface $logger): JsonResponse
    {
        // Validate user request
        $user = $this->apiHelperService->validateUserRequest($request);
        if ($user instanceof JsonResponse) {
            return $user;
        }

        // Validation
        $agent = $this->apiHelperService->validateAgentExists('discussion_title_generator', $request);
        if ($agent instanceof JsonResponse) {
            return $agent;
        }

        // Get User
        $data = $this->apiHelperService->extractRequestData($request);

        // Check discussion key
        $discussionKey = $data['discussionKey'] ?? null;
        if (!$discussionKey) {
            return $this->apiHelperService->jsonResponse([
                'message' => 'Bad Request: discussionKey',
            ], 400);
        }
        // Check if discussion exists
        $discussion = $this->discussionRepository->findOneBy(['uniqueKey' => $discussionKey]);
        if (!$discussion) {
            return $this->apiHelperService->jsonResponse([
                'message' => 'Discussion not found',
            ], 404);
        }

        // Get discussion messages
        $messages = $discussion->getMessages();

        // We need at least one message to generate a title
        if ($messages->isEmpty()) {
            return $this->apiHelperService->jsonResponse([
                'message' => 'No messages in discussion',
            ], 400);
        }

        // Get messages for title generation
        $userMessage = null;
        $aiResponse = null;

        // Find the first user message and the first AI response
        foreach ($messages as $message) {
            if ($message->getRole() === 'user' && $userMessage === null) {
                $userMessage = $message->getContent();
            } else if ($message->getRole() === 'assistant' && $aiResponse === null) {
                $aiResponse = $message->getContent();
            }

            // Break if we found both
            if ($userMessage !== null && $aiResponse !== null) {
                break;
            }
        }

        // Truncate messages if they are too long
        if ($userMessage && strlen($userMessage) > 300) {
            $userMessage = substr($userMessage, 0, 297) . '...';
        }

        if ($aiResponse && strlen($aiResponse) > 300) {
            $aiResponse = substr($aiResponse, 0, 297) . '...';
        }

        // Create prompt with both user message and AI response if available
        $prompt = "Here is the first user message from the discussion: \n" . ($userMessage ?: 'No user message');

        if ($aiResponse) {
            $prompt .= "\n\nHere is the AI's response: \n" . $aiResponse;
        }

        $prompt .= "\n ---------------------------\n\n";
        $prompt .= 'Return one sentence (no explanation) that will be used as the discussion title in a folder of discussions. The title should be short and to the point and that the user can remember what it was all about. Max 7 words.';

        // Generate title
        try {
            $response = $this->agentTalkService->executeAgentTalk($agent, ['message' => $prompt], null, true);
            $newTitle = trim($response, '"');

            // Save discussion with the new title
            $discussion->setTitle($newTitle);
            $this->discussionRepository->save($discussion, true);

            return $this->apiHelperService->jsonResponse([
                'message'    => 'Discussion Title updated successfully',
                'discussion' => $discussion->toArray(),
                'call'       => [
                    'response'     => $response,
                    'responseText' => $newTitle,
                ]
            ]);

        } catch (\Exception $e) {
            $logger->error('Failed to generate discussion title', ['error' => $e->getMessage()]);

            return $this->apiHelperService->jsonResponse([
                'message' => 'Failed to generate discussion title',
            ], 500);
        }
    }

    #[Route('/discussion/toggle-favorite', name: 'discussion_toggle_favorite', methods: ['POST'])]
    public function toggleFavorite(Request $request): JsonResponse
    {
        // Validate user request
        $user = $this->apiHelperService->validateUserRequest($request);
        if ($user instanceof JsonResponse) {
            return $user;
        }

        // Get request data
        $data = $this->apiHelperService->extractRequestData($request);

        // Check discussion key
        $discussionKey = $data['discussionKey'] ?? null;
        if (!$discussionKey) {
            return $this->apiHelperService->jsonResponse([
                'message' => 'Bad Request: discussionKey required',
            ], 400);
        }

        // Check if discussion exists
        $discussion = $this->discussionRepository->findByKeyAndUser($discussionKey, $user->getId());
        if (!$discussion) {
            return $this->apiHelperService->jsonResponse([
                'message' => 'Discussion not found',
            ], 404);
        }

        // Toggle favorite status
        $discussion->setFavorite(!$discussion->isFavorite());
        $this->discussionRepository->save($discussion, true);

        return $this->apiHelperService->jsonResponse([
            'message'  => 'Discussion favorite status updated',
            'response' => [
                'discussion' => $discussion->toArray(),
                'isFavorite' => $discussion->isFavorite()
            ]
        ]);
    }

    #[Route('/mydocument/{id}', name: 'document_download', methods: ['GET'])]
    public function downloadDocument(int $id, Request $request, LoggerInterface $logger): Response
    {
        // Validate user request
        $user = $this->apiHelperService->validateUserRequest($request);
        if ($user instanceof JsonResponse) {
            return $user;
        }

        // Find the file
        $file = $this->fileEntityService->getFileById($id);
        if (!$file) {
            return $this->apiHelperService->jsonResponse([
                'message' => 'File not found',
            ], 404);
        }

        // Check if file belongs to one of the user's discussions
        $isFileAuthorized = false;
        $discussions = $this->discussionRepository->findByUser($user);

        foreach ($discussions as $discussion) {
            foreach ($discussion->getMessages() as $message) {
                if ($message->getFiles()->contains($file)) {
                    $isFileAuthorized = true;
                    break 2;
                }
            }
        }

        if (!$isFileAuthorized) {
            return $this->apiHelperService->jsonResponse([
                'message' => 'Unauthorized access to this file',
            ], 403);
        }

        // Determine how to deliver the file based on its type
        $mimeType = $file->getMimeType();
        $fileName = $file->getOriginalFilename();
        $fullPath = $file->getFullPath();

        // If it's an image or can be displayed in browser
        $inlineTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml',
            'application/pdf', 'text/plain', 'text/html'
        ];

        // Check if file exists physically
        if (!file_exists($fullPath)) {
            return $this->apiHelperService->jsonResponse([
                'message' => 'File not found on disk',
            ], 404);
        }

        $disposition = in_array($mimeType, $inlineTypes) ? 'inline' : 'attachment';

        $response = new BinaryFileResponse($fullPath);
        $response->headers->set('Content-Type', $mimeType);
        $response->setContentDisposition(
            $disposition,
            $fileName
        );

        return $response;
    }
}
