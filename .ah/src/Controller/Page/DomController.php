<?php

namespace App\Controller\Page;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use App\Repository\Ai\AgentRepository;

class DomController extends AbstractController
{
    #[Route('/dom/{agent_code}', name: 'app_dom')]
    public function index(string $agent_code, AgentRepository $agentRepository): Response
    {
        // Fetch the latest AIAgent by code
        $aiAgent = $agentRepository->findLatestByCode($agent_code);

        // Render the view with the agent data
        return $this->render('home/index.html.twig', [
            'aiAgent' => $aiAgent,
        ]);
    }
}
