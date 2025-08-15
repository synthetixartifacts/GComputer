<?php

namespace App\Controller\Api\V1\Agents;

use App\Controller\Api\AbstractBaseApiController;
use App\Repository\Ai\AgentRepository;
use App\Repository\User\UserRepository;
use App\Repository\Memory\CustomInstructionRepository;
use App\Service\Api\ApiHelperService;

use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\SecurityBundle\Security;

#[Route('/api/v1', name: 'api_v1_')]
class AgentsApiController extends AbstractBaseApiController
{
    public function __construct(
        private Security $security,
        private AgentRepository $agentRepository,
        private UserRepository $userRepository,
        private CustomInstructionRepository $customInstructionRepository,
        protected ApiHelperService $apiHelperService,
    ) {
        parent::__construct(
            $apiHelperService,
        );
    }

    // Return agent list for the loggued user
    #[Route('/agents/list/', name: 'agents_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        // Validate user request
        $user = $this->apiHelperService->validateUserRequest($request);
        if ($user instanceof JsonResponse) {
            return $user;
        }

        $agentList = $this->agentRepository->getAgentListForUser($user);

        return $this->apiHelperService->jsonResponse([
            'message'  => 'List of available agents',
            'response' => $agentList
        ], 200);
    }

    #[Route('/agent/getbycode/{agent_code}', name: 'agent_getbycode', methods: ['GET'])]
    public function getByCode(string $agent_code, Request $request): JsonResponse
    {
        // Validation
        $agent = $this->apiHelperService->validateAgentAccessRequest($agent_code, $request);
        if ($agent instanceof JsonResponse) {
            return $agent;
        }

        $user        = $this->apiHelperService->getUser();
        $returnAgent = $agent->toArray(true);

        if ($user) {
            $returnAgent['isUserManager'] = $agent->isUserManager($user);

            // Get personalized things
            $returnAgent['customInstruction'] = [
                'user'    => $this->customInstructionRepository->getUserCustomInstructionValue($agent, $user),
                'default' => $this->customInstructionRepository->getDefaultCustomInstructionValue($agent)
            ];
        }

        return $this->apiHelperService->jsonResponse([
            'message'  => 'Get Agent by code',
            'response' => $returnAgent,
        ], 200);
    }
}
