<?php

namespace App\Controller\Public;

use App\Repository\Ai\AgentRepository;
use App\Repository\DiscussionRepository;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class AiAgentController extends AbstractController
{

    public function __construct(
        private AgentRepository $agentRepository,
        private DiscussionRepository $discussionRepository,
    ) { }

    #[Route('/public/agent/{agent_code}', name: 'public_app_chatbot_agent')]
    public function home(): Response
    {
        return $this->render('pages/public/chatbot/home.html.twig');
    }
}
