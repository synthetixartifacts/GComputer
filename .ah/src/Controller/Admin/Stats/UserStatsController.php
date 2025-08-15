<?php

namespace App\Controller\Admin\Stats;

use App\Repository\User\UserRepository;
use App\Repository\DiscussionRepository;
use EasyCorp\Bundle\EasyAdminBundle\Config\Dashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\MenuItem;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractDashboardController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class UserStatsController extends AbstractDashboardController
{
    public function __construct(
        private UserRepository $userRepository,
        private DiscussionRepository $discussionRepository,
    ) {}

    #[Route('/admin/stats/users', name: 'admin_user_stats')]
    public function index(): Response
    {
        // Date ranges for statistics
        $now = new \DateTime();
        $lastWeek = (clone $now)->modify('-7 days');
        $lastMonth = (clone $now)->modify('-1 month');
        
        // Get most active users for different time periods
        $activeUsersLastWeek = $this->getMostActiveUsers($lastWeek, $now);
        $activeUsersLastMonth = $this->getMostActiveUsers($lastMonth, $now);
        $activeUsersTotal = $this->getMostActiveUsers();
        
        return $this->render('admin/stats/user_stats.html.twig', [
            'activeUsersLastWeek' => $activeUsersLastWeek,
            'activeUsersLastMonth' => $activeUsersLastMonth,
            'activeUsersTotal' => $activeUsersTotal,
        ]);
    }
    
    /**
     * Get most active users with their discussions and messages counts
     * 
     * @param \DateTimeInterface|null $startDate
     * @param \DateTimeInterface|null $endDate
     * @return array
     */
    private function getMostActiveUsers(\DateTimeInterface $startDate = null, \DateTimeInterface $endDate = null): array
    {
        $qb = $this->discussionRepository->createQueryBuilder('d')
            ->select('u.id', 'u.email', 'u.firstName', 'u.lastName', 
                    'COUNT(DISTINCT d.id) as discussionCount', 
                    'COUNT(m.id) as messageCount')
            ->join('d.user', 'u')
            ->leftJoin('d.messages', 'm')
            ->groupBy('u.id')
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