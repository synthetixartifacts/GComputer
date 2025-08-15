<?php

namespace App\Controller\Admin;

use App\Entity\Ai\AIAgent;
use App\Entity\Discussion\Discussion;
use App\Repository\Ai\AgentRepository;
use App\Repository\DiscussionRepository;
use EasyCorp\Bundle\EasyAdminBundle\Provider\AdminContextProvider;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/admin/public-agents')]
#[IsGranted('ROLE_ADMIN')] // Ensure only admins can access this section
class PublicAgentDiscussionController extends AbstractController
{
    public function __construct(
        private AgentRepository $agentRepository,
        private DiscussionRepository $discussionRepository
    ) {}

    #[Route('', name: 'admin_public_agents', methods: ['GET'])]
    public function listPublicAgents(): Response
    {
        // Removed context fetching
        $publicAgents = $this->agentRepository->findPublicAgents();

        return $this->render('admin/public_agent/list_agents.html.twig', [
            'agents' => $publicAgents,
            // Removed 'ea' => $eaContext
        ]);
    }

    #[Route('/{id}/discussions', name: 'admin_public_agent_discussions', methods: ['GET'])]
    public function listAgentDiscussions(AIAgent $agent): Response
    {
        // Removed context fetching
        if (!$agent->isPublic()) {
            $this->addFlash('warning', 'This agent is not public.');
            return $this->redirectToRoute('admin_public_agents');
        }

        // Fetch discussions for this agent where user is null
        $discussions = $this->discussionRepository->findBy(['aiAgent' => $agent, 'user' => null], ['createdAt' => 'DESC']);

        return $this->render('admin/public_agent/list_discussions.html.twig', [
            'agent' => $agent,
            'discussions' => $discussions,
            // Removed 'ea' => $eaContext
        ]);
    }

    #[Route('/discussions/{id}', name: 'admin_public_discussion_view', methods: ['GET'])]
    public function viewDiscussion(Discussion $discussion): Response
    {
        // Removed context fetching
        // Ensure the discussion belongs to a public agent and has no user
        $agent = $discussion->getAiAgent();
        if (!$agent || !$agent->isPublic() || $discussion->getUser() !== null) {
            $this->addFlash('warning', 'Invalid discussion.');
            // Redirect to the list of agents or a relevant page
            return $this->redirectToRoute('admin_public_agents');
        }

        // Messages should be loaded automatically via the Discussion entity relationship
        $messages = $discussion->getMessages();

        return $this->render('admin/public_agent/view_discussion.html.twig', [
            'discussion' => $discussion,
            'messages' => $messages,
            'agent' => $agent,
            // Removed 'ea' => $eaContext
        ]);
    }
}