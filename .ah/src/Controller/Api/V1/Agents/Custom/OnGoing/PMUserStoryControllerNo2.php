<?php

// TODO place this in ERA_Custom Folder

namespace App\Controller\Api\V1\Agents\Custom\OnGoing;

use App\Controller\Api\V1\Agents\AbstractAgentApiController;
use App\Entity\Ai\AIAgent;
use App\Entity\Ai\AIModel;
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

// #[Route('/api/v1', name: 'api_v1_')]
class PMUserStoryControllerNo2 extends AbstractAgentApiController
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

    // #[Route('/agent/talk/pm_user_story_creator', name: 'agent_talk_pm_user_story_creator', methods: ['POST', 'GET'], priority: 1)]
    public function apiTalk(Request $request): JsonResponse
    {
        return $this->apiHelperService->notImplementedYetResponse();
    }


    // #[Route('/agent/stream/pm_user_story_creator', name: 'agent_talk_stream_pm_user_story_creator', methods: ['POST', 'GET'], priority: 1)]
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




        // Learning process per interaction
        $this->learnFromInteraction($discussion, $data, $agent);
        echo '<pre>';
        print_r([
        'TOMMY is here',
        $data,
        ]);
        die;






        // TODO - For base agent, we need to validate that action are available befoire creating actionState

        // TODO - MANAGE THINGS WITHOUT ACTION STATE IF POSSIBLE AND ONLY TALKING POINT
        // Get/Create default state -
        $actionState = $this->actionStateRepository->findOneByDiscussion($discussion);
        if (!$actionState) {
            $actionState = $this->actionStateRepository->createActionState($discussion, 'start', 'Starting the process');
        }





        $customAction = [
            ['code' => 'stop_process', 'description' => 'Action to trigger when and only when the user asks to stop or reset the current ongoing action, process and/or discussion.'],
            ['code' => 'export_file', 'description' => 'Action that export story/stories as CSV file for the user to download. Use only if the user ask it.'],
            ['code' => 'story_list_creation', 'description' => 'Action to execute when the user sends conceptual or project documents, or any information that can be converted into a list of user stories to developer. Do not use it for unitaire story creation.'],
        ];



        // Manage userMessage
        $userMsg = $data['message'] ?? '';
        $content = '';
        if (isset($data['fileIds']) || count($data['fileIds']) > 0) {
            $fileIds = $data['fileIds'];
            $content = $this->fileEntityService->getFilesContentMsgByIdsForUserMsg($fileIds, false);
            unset($data['fileIds']);
        }
        $data['message'] = $content . $userMsg;


        if (!$actionState || $actionState->getState() === 'start') {
            // Check if we need to execute an action
            $actionToExecute = $this->actionService->getActionToExecute($agent, $data['message'], $customAction);

            if ($actionToExecute) {
                [$data, $agent] = $this->executeAction($discussion, $actionToExecute, $actionState, $agent, $data);
            }

        } else {
            // echo '<pre>';
            // print_r([
            // 'TOMMY is YEYEYS',
            // ]);
            // die;
            // Action is already in progress
            [$data, $agent] = $this->executeAction($discussion, $actionState->getState(), $actionState, $agent, $data);
        }


        // TODO - to separate user message per epic list and content if only one userMsg, we look for <project_infos><epic_list>


        // echo '<pre>';
        // print_r([
        // 'TOMMY TALK',
        // $actionState && $actionState->getState() ?: null,
        // $actionToExecute ?: null,
        // $data
        // ]);
        // die;

        // TODO
        // THINKING
        // ANSWER back to the user but already callback the api to continue automatically the process



        return $this->agentTalkService->executeAgentTalkStream($agent, $data, $discussion);
    }


    private function learnFromInteraction($discussion, $data, $agent) {
        $learning = $discussion->getStateParams();

        // Epic list
        // Documents to explode in story
        // Check files content

        if (isset($data['fileIds']) || count($data['fileIds']) > 0) {
            // We analyse the file to check if it is useful for us in this context
            foreach($data['fileIds'] as $fileId) {
                $file      = $this->fileEntityService->getFileById($fileId);
                $content   = $file->getContent();
                $file_name = $file->getOriginalFilename();

                // Ask LLM if useful
                $analyse = $this->analyseFileToLearn($content, $file_name, $agent);
                if ($analyse !== 'NOT USEFUL') {
                    // We learn from the content
                    $learning['files'][] = [
                        'fileId'  => $fileId,
                        'useful'  => $analyse,
                    ];
                }
            }
        }

        // Then we analyse the user message

    }


    private function analyseFileToLearn($content, $file_name, $agent): string
    {
        if (!$content || $content == '') {
            return null;
        }

        $agentRole = <<<TEXT
        <role_overide>
        You are temporarily reassigned as a file content validator. Your sole purpose is to assess whether the provided file content is useful for the main task or not.</role_overide>
        -----
        TEXT;

        $agentInstruction = <<<TEXT
        -----
        <instruction>
        Analyze the provided file content and respond in one of two ways:
        1. If not relevant, respond only with: NOT USEFUL
        2. If useful, provide exactly one short sentence summarizing the content and explain how it can be useful for the main task.
        </instruction>
        TEXT;

        $msg = $agentRole . $content . $agentInstruction;


        $response = $this->rawCall->talk($agent, $msg);
        return $this->rawCall->getAgentResponseText($agent, $response);

    }









    private function executeAction($discussion, $actionCode, $actionState, $agent, $data)
    {
        switch ($actionCode) {
            case 'stop_process':
                return $this->actionStop($discussion, $actionState, $agent, $data);
            case 'validate_infos':
                return $this->actionValidateInfos($discussion, $actionState, $agent, $data);
            case 'export_file':
                // return $this->exportFile();
                break;
            case 'story_list_creation':
                return $this->storyListCreation($discussion, $actionState, $agent, $data);
                break;
            default:
                // return $this->apiHelperService->errorNotFoundResponse();
        }
    }


    private function actionStop($discussion, $actionState, $agent, $data): array
    {
        $actionState = $this->actionStateRepository->updateState($actionState, 'start', 'stopped');

        $userMessage = $data['message'] ?? '';
        $message = <<<TEXT
        <context>We just stopped the current process and reseted everything. You can let the user know about this. If he want to continue, it will have to start over.</context>
        TEXT;

        $data['message'] = $message . $userMessage;

        return [
            $data,
            $agent
        ];
    }



    private function storyListCreation($discussion, $actionState, $agent, $data): array
    {
        // Check if we are at the first step
        // if so trigger validation
        if ($actionState->getState() == 'start') {
            $actionState = $this->actionStateRepository->updateState($actionState, 'validate_infos', 'validating');
            return $this->actionValidateInfos($discussion, $actionState, $agent, $data);
        }

        return [];
    }



    private function actionValidateInfos($discussion, $actionState, $agent, $data): array
    {
        $userMessage = $data['message'] ?? '';

        $agentRole = <<<TEXT
        <role_overide>You must validate whether there is required information to run your main task optimally or not. If you're missing information, you are allowed to ask it back normally to the user.</role_overide>
        -----
        TEXT;

        $agentInstruction = <<<TEXT
        -----
        <instruction>For this turn, validate if the user's message contains sufficient information to create user stories by checking for:
        1. Clear project context or background
        2. Main functionality requirements
        3. Target users or stakeholders
        4. Expected outcomes or goals
        5. Clear epic list (optional but you MUST ask the user at least once if not present. If the user already said it's not needed, you can skip this and inform the user you will be creating user stories without it)

        When requesting any missing information:
        - Check conversation history to avoid duplicate requests
        - Be specific about what information is missing
        - Use clear, direct language in your requests

        Response format:
        - If all required information is present: let the user know with a short sentence that we have everything needed to create a list of task and make sure to end your output with this tag alone in a new line: <auto_callback> to trigger the next step automatically.
        - If information is missing: Ask for specific missing details in natural language, without using <auto_callback> tag, simply ask in a clear and straight forward manner what your are missing.

        Aim to prioritize seeking information for the first turn, and then simply process.
        </instruction>
        TEXT;

        $data['message'] = $agentRole . $userMessage . $agentInstruction;

        return [
            $data,
            $agent
        ];

    }



}