<?php

namespace App\Controller\Api\V1\Agents;

use App\Controller\Api\AbstractBaseApiController;
use App\Entity\Ai\AIAgent;
use App\Entity\Discussion\Discussion;
use App\Service\Api\ApiHelperService;
use App\Service\Ai\Agent\AgentTalkService;
use App\Service\DiscussionService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\StreamedResponse;

abstract class AbstractAgentApiController extends AbstractBaseApiController
{
    public function __construct(
        protected ApiHelperService $apiHelperService,
        protected AgentTalkService $agentTalkService,
        protected DiscussionService $discussionService,
        protected EntityManagerInterface $entityManager,
    ) {
        parent::__construct($apiHelperService);
    }


    // TODO - Should we put this in agentTalkService file instead?
    public function streamExactMessageAgent(
        string $message,
        ?Discussion $discussion = null
    ) {
        $agent = $this->apiHelperService->getLastestAgentByCode('def_gpt_4o');  // TODO - put this in config

        $agentRole = <<<TEXT
        <role_overide>Your role right now is to return EXACTLY the text that is inside <text_to_return> tag to the user, nothing less, nothing more. EXACTLY THE SAME TEXT.</role_overide>
        -----
        TEXT;

        $message = $agentRole. "<text_to_return>" . $message . "</text_to_return>";
        $data    = [ 'message' => $message ];


        return $this->agentTalkService->executeAgentTalkStream($agent, $data, $discussion);
    }

    public function streamForceResponse(
        $agent,
        string $message,
        $discussion
    ): StreamedResponse {
        return $this->agentTalkService->createStreamResponse(function () use ($agent, $message, $discussion): void {
            $chunk = [
                'statusCode' => 200,
                'content' => $message,
                'data' => ['content' => $message],
            ];

            $streamData = $this->agentTalkService->createReturnData(
                    agent: $agent,
                    data: [],
                    discussion: $discussion,
                    userMsg: $message ?? '',
                    response: $chunk,
                    responseText: $message,
                    status: 200,
                    message: 'Generate Image'
                );

            $dataToStream = is_array($streamData) ? $streamData : ['data' => $streamData];
            $this->agentTalkService->streamData($dataToStream);
        });
    }
}