<?php

namespace App\Controller\Chatbot;

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
    ) {}

    #[Route('/', name: 'app_chatbot')]
    #[Route('/account/{code}', name: 'app_account')]
    #[Route('/discussions', name: 'app_chatbot_discussions')]
    #[Route('/discussion/{code}', name: 'app_chatbot_discussion')]
    #[Route('/agent/{agent_code}', name: 'app_chatbot_agent')]
    public function home(): Response
    {
        return $this->render('pages/chatbot/home.html.twig');
    }
}
