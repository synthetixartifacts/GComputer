<?php

// TODO place this in ERA_Custom Folder

namespace App\Controller\Api\V1\Agents\Custom\OnGoing;

use App\Controller\Api\V1\Agents\AbstractAgentApiController;
use App\Service\Api\ApiHelperService;
use App\Service\Ai\Agent\AgentTalkService;
use App\Service\File\FileService;
use App\Service\File\FileEntityService;
use App\Service\DiscussionService;
use App\Service\Action\ActionService;
use App\Repository\Action\ActionStateRepository;
use App\Service\Ai\Agent\AgentRawCallService;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Doctrine\ORM\EntityManagerInterface;

#[Route('/api/v1', name: 'api_v1_')]
class PMUserStoryController extends AbstractAgentApiController
{
    public function __construct(
        protected FileService $fileService,
        protected FileEntityService $fileEntityService,
        protected ActionStateRepository $actionStateRepository,
        protected ActionService $actionService,
        protected AgentRawCallService $rawCall,
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

    #[Route('/agent/talk/pm_user_story_creator', name: 'agent_talk_pm_user_story_creator', methods: ['POST', 'GET'], priority: 1)]
    public function apiTalk(Request $request): JsonResponse
    {
        return $this->apiHelperService->notImplementedYetResponse();
    }


    #[Route('/agent/stream/pm_user_story_creator', name: 'agent_talk_stream_pm_user_story_creator', methods: ['POST', 'GET'], priority: 1)]
    public function apiTalkStream(Request $request): StreamedResponse|JsonResponse
    {
        // Validation
        $agent = $this->apiHelperService->validateAgentAccessRequest('pm_user_story_creator', $request);
        if ($agent instanceof JsonResponse) {
            return $agent;
        }

        // Check if there is a file to parse
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


        // Extract data
        $userMsg = $data['message'] ?? '';
        $fileIds = $data['fileIds'];







        $userMsg = '';
        $fileIds = [383, 384];


        //
        foreach ($fileIds as $fileId) {

            // We summarize each file
            $fileContent[] = $this->fileEntityService->getFileContentByFileId($fileId);
            # code...
        }
        $content = $this->fileEntityService->getFilesContentMsgByIdsForUserMsg($fileIds, false);

        echo '<pre>';
        print_r([
        'TOMMY is here',
        $fileContent,
        ]);
        die;
        unset($data['fileIds']);

        // Create a complete summary of the project




        return $this->agentTalkService->executeAgentTalkStream($agent, $data, $discussion);
    }







    private function getSowSummary(): string
    {
        return <<<TEXT
        ## Summary
        The project focuses on developing a comprehensive B2B eCommerce solution for Gildan, integrating Adobe Commerce with JD Edwards. The solution aims to enhance user experience for B2B clients while ensuring secure and efficient data exchange between systems.

        ## Project Scope
        Implementation of Adobe Commerce for B2B platform
        Secure connector development for JD Edwards integration
        Multi-language support implementation
        Development of custom B2B features and functionalities

        ## Core Functionalities
        Advanced reordering capabilities with order history
        B2B-specific checkout with PO support
        Order splitting across multiple warehouses
        Persistent shopping cart functionality
        Real-time shipping and tax calculations
        Enhanced customer segmentation and profiling
        Integration with logistics providers
        Contentful integration for content management
        Comprehensive reporting and analytics
        Advanced search capabilities
        Self-service customer support portal

        ## Technical Requirements
        Adobe Commerce platform implementation
        API integrations development
        Security and compliance measures
        Performance optimization
        Scalability considerations

        ## Action Items
        ### Gildan Team
        Prepare for UX/UI design workshops
        Secure internal approvals for project phases
        Provide test data for development
        Define customer segmentation requirements
        Review and approve technical specifications

        ### ERA Consulting Group
        Develop initial architecture plans
        Create Adobe Commerce platform design
        Establish training programs
        Implement reordering and checkout processes
        Develop persistent shopping cart features
        Set up shipping and logistics integration
        Configure ERP system integration
        Implement reporting features
        Design customer management functionalities
        Create self-service portal
        TEXT;
    }


}