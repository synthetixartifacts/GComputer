<?php

namespace App\Controller\Dev;

use App\Service\Web\BrowseUrlService;
use App\Controller\Api\V1\Agents\AbstractAgentApiController;
use App\Repository\Ai\AgentRepository;
use App\Service\Ai\Agent\AgentService;
use App\Service\Api\ApiHelperService;
use App\Service\Ai\Agent\AgentTalkService;
use App\Service\DiscussionService;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Doctrine\ORM\EntityManagerInterface;

class AjaxApiTesterController extends AbstractAgentApiController
{
    public function __construct(
        private AgentRepository $agentRepository,
        private AgentService $agentService,
        private BrowseUrlService $browseUrlService,
        private ParameterBagInterface $params,
        protected ApiHelperService $apiHelperService,
        protected AgentTalkService $agentTalkService,
        protected DiscussionService $discussionService,
        protected EntityManagerInterface $entityManager,
    ) {
        parent::__construct(
            $apiHelperService,
            $agentTalkService,
            $discussionService,
            $entityManager,
        );
    }

    // http://agenthub.test/dev/ajaxapitester
    #[Route('/ajaxapitester', name: 'dev_ajaxapitester')]
    public function index(Request $request): Response
    {
        // Validation
        // $agent = $this->apiHelperService->validateAgentAccessRequest('def_gpt_4o_mini', $request);



        $code        = 'mai_user_123';
        $agent = $this->agentRepository->findLatestByCode($code);


        $message = 'give me a short n sweet resume of that url:
https://learn.microsoft.com/en-us/dynamics365/release-plan/2025wave1/smb/dynamics365-business-central/planned-features';

        $content = $this->agentService->talk($agent, $message);


        // $content = $this->browseUrlService->extractContentFromUrl('https://www.groupeconseilera.com/en/company/methodology');

        // $content = $this->browseUrlService->extractContentFromUrl('https://experienceleague.adobe.com/en/docs/commerce-operations/release/notes/adobe-commerce/2-4-8');

        // $content = $this->browseUrlService->extractContentFromUrl('https://learn.microsoft.com/en-us/dynamics365/release-plan/2025wave1/smb/dynamics365-business-central/planned-features');


        // $message = 'Give me the content of the url https://www.groupeconseilera.com/en/company/methodology';


        echo '<pre>';
        print_r([
        'TOMMY is here',
        'YO',
        $agent->toArray(),
        $content,
        ]);
        die;





        return $this->render('dev/ajaxtest.html.twig');
    }



    // http://agenthub.test/dev/test/image
    #[Route('/test/image', name: 'test_image', methods: ['GET'])]
    public function image(): JsonResponse
    {

        $code        = 'together_image';
        $agent = $this->agentRepository->findLatestByCode($code);


        // echo '<pre>';
        // print_r([
        // 'TOMMY is here',
        // 'image',
        // $latestAgent->toArray()
        // ]);
        // die;


        $return = $this->agentService->talk($agent, 'A lac in the middle of a field, photography and cartoonn style');

        echo '<pre>';
        print_r([
        'TOMMY is here',
        $return,
        ]);
        die;

        // return $this->agentTalkService->executeAgentTalk($agent, []);

        // return $this->apiHelperService->jsonResponse([
        //     'message' => 'Test Browse Web',
        //     $content
        // ]);
    }





    #[Route('/test/whisper', name: 'test_whisper', methods: ['GET'])]
    public function whisper(): JsonResponse
    {

        $code        = 'whisper';
        $latestAgent = $this->agentRepository->findLatestByCode($code);
        $filePath    = $this->params->get('kernel.project_dir') . '/var/uploads/audio/test_audio.wav';

        $this->agentService->whisper($latestAgent, $filePath);

        echo '<pre>';
        print_r([
        'TOMMY is here',
        'WHISPER',
        ]);
        die;

        return $this->apiHelperService->jsonResponse([
            'message' => 'Test Browse Web',
            $content
        ]);
    }





    #[Route('/test/browse-web', name: 'test_browse_web', methods: ['GET'])]
    public function browse(): JsonResponse
    {

        $content = $this->browseUrlService->extractContentFromUrl('https://www.groupeconseilera.com/en/company/methodology');

        return $this->apiHelperService->jsonResponse([
            'message' => 'Test Browse Web',
            $content
        ]);
    }

    #[Route('/test', name: 'test', methods: ['GET'])]
    public function test(): JsonResponse
    {
        $code        = 'to_meta_llama31_8b_default';
        $latestAgent = $this->agentRepository->findLatestByCode($code);
        $response    = $this->agentService->talk($latestAgent, 'Give me something');

        if ($latestAgent) {
            return $this->apiHelperService->jsonResponse([
                'message' => 'Talk To Agent',
                'agent'   => $latestAgent->toArray(),
                'talk'    => $response,
            ]);
        }

        return $this->apiHelperService->jsonResponse([
            'message' => 'No AI Agent found with the given code',
        ], 404);
    }
}
