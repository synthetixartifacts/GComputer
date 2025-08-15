<?php

namespace App\Controller\Api\V1;

use App\Service\Web\BrowseUrlService;

use App\Controller\Api\AbstractBaseApiController;
use App\Repository\Ai\AgentRepository;
use App\Service\Ai\Agent\AgentService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;

#[Route('/api/v1', name: 'api_v1_')]
class TestAPIController extends AbstractBaseApiController
{
    public function __construct(
        private AgentRepository $agentRepository,
        private AgentService $agentService,
        private BrowseUrlService $browseUrlService,
        private ParameterBagInterface $params,
    ) {}




    // #[Route('/test/whisper', name: 'test_whisper', methods: ['GET'])]
    // public function whisper(): JsonResponse
    // {

    //     $code        = 'whisper';
    //     $latestAgent = $this->agentRepository->findLatestByCode($code);
    //     $filePath    = $this->params->get('kernel.project_dir') . '/var/uploads/audio/test_audio.wav';

    //     $this->agentService->whisper($latestAgent, $filePath);

    //     return $this->apiHelperService->jsonResponse([
    //         'message' => 'Test Browse Web',
    //         $content
    //     ]);
    // }





    // #[Route('/test/browse-web', name: 'test_browse_web', methods: ['GET'])]
    // public function browse(): JsonResponse
    // {

    //     $content = $this->browseUrlService->browseUrl('https://www.groupeconseilera.com/en/company/methodology');

    //     return $this->apiHelperService->jsonResponse([
    //         'message' => 'Test Browse Web',
    //         $content
    //     ]);
    // }

    // #[Route('/test', name: 'test', methods: ['GET'])]
    // public function test(): JsonResponse
    // {
    //     $code        = 'to_meta_llama31_8b_default';
    //     $latestAgent = $this->agentRepository->findLatestByCode($code);
    //     $response    = $this->agentService->talk($latestAgent, 'Give me something');

    //     if ($latestAgent) {
    //         return $this->apiHelperService->jsonResponse([
    //             'message' => 'Talk To Agent',
    //             'agent'   => $latestAgent->toArray(),
    //             'talk'    => $response,
    //         ]);
    //     }

    //     return $this->apiHelperService->jsonResponse([
    //         'message' => 'No AI Agent found with the given code',
    //     ], 404);
    // }
}