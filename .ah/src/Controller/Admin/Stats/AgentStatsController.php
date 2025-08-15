<?php

namespace App\Controller\Admin\Stats;

use App\Repository\Ai\AgentRepository;
use App\Repository\DiscussionRepository;
use EasyCorp\Bundle\EasyAdminBundle\Config\Dashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\MenuItem;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractDashboardController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class AgentStatsController extends AbstractDashboardController
{
    public function __construct(
        private AgentRepository $agentRepository,
        private DiscussionRepository $discussionRepository,
    ) {}

    #[Route('/admin/stats/agents', name: 'admin_agent_stats')]
    public function index(): Response
    {
        // Date ranges for statistics
        $now = new \DateTime();
        $lastWeek = (clone $now)->modify('-7 days');
        $lastMonth = (clone $now)->modify('-1 month');
        
        // Get most used agents for different time periods
        $popularAgentsLastWeek = $this->getMostUsedAgents($lastWeek, $now);
        $popularAgentsLastMonth = $this->getMostUsedAgents($lastMonth, $now);
        $popularAgentsTotal = $this->getMostUsedAgents();
        
        return $this->render('admin/stats/agent_stats.html.twig', [
            'popularAgentsLastWeek' => $popularAgentsLastWeek,
            'popularAgentsLastMonth' => $popularAgentsLastMonth,
            'popularAgentsTotal' => $popularAgentsTotal,
        ]);
    }
    
    /**
     * Get most used agents with their discussions and messages counts
     * 
     * @param \DateTimeInterface|null $startDate
     * @param \DateTimeInterface|null $endDate
     * @return array
     */
    private function getMostUsedAgents(\DateTimeInterface $startDate = null, \DateTimeInterface $endDate = null): array
    {
        $qb = $this->discussionRepository->createQueryBuilder('d')
            ->select('a.id', 'a.name', 'a.code', 
                    'COUNT(DISTINCT d.id) as discussionCount', 
                    'COUNT(m.id) as messageCount')
            ->join('d.aiAgent', 'a')
            ->leftJoin('d.messages', 'm')
            ->groupBy('a.id')
            ->orderBy('discussionCount', 'DESC')
            ->setMaxResults(20);
        
        // Apply date range filter if provided
        if ($startDate && $endDate) {
            $qb->andWhere('d.createdAt BETWEEN :startDate AND :endDate')
               ->setParameter('startDate', $startDate)
               ->setParameter('endDate', $endDate);
        }
        
        return $qb->getQuery()->getResult();
    }
    
    public function configureDashboard(): Dashboard
    {
        return Dashboard::new()->setTitle('AgentHub Admin');
    }

    public function configureMenuItems(): iterable
    {
        // Return an empty array since the menu is already configured in the main DashboardController
        return [];
    }
} 