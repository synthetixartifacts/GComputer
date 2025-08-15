<?php

namespace App\Controller\Admin;

use EasyCorp\Bundle\EasyAdminBundle\Config\Dashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\MenuItem;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractDashboardController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use App\Entity\User\User;
use App\Entity\User\Team;
use App\Entity\Ai\AIProvider;
use App\Entity\Ai\AIModel;
use App\Entity\Ai\AIAgent;
use App\Entity\Ai\AIAgentArchive;
use App\Entity\Settings;
use App\Entity\Admin\AdminSettings;
use App\Entity\Memory\Memory;
use App\Entity\Action\Action;
use App\Entity\Memory\CustomInstruction;
use App\Entity\Memory\AgentLearn;
use App\Entity\Term\TermsOfUse;
use App\Repository\User\UserRepository;
use App\Repository\Ai\AgentRepository;
use App\Repository\DiscussionRepository;

class DashboardController extends AbstractDashboardController
{
    public function __construct(
        private UserRepository $userRepository,
        private AgentRepository $aiAgentRepository,
        private DiscussionRepository $discussionRepository,
    ) {}

    #[Route('/admin', name: 'admin')]
    #[Route('/admin/{year}', name: 'admin_with_year', requirements: ['year' => '\d{4}'])]
    public function dashboard(Request $request, ?int $year = null): Response
    {
        // Determine current fiscal year if not provided
        $currentFiscalYear = $this->getCurrentFiscalYear();
        $selectedYear = $year ?? $currentFiscalYear;

        // Existing stats
        $totalUsers       = $this->userRepository->count([]);
        $totalAgents      = $this->aiAgentRepository->count([]);
        $totalDiscussions = $this->discussionRepository->count([]);

        // Usage stats
        // ------------
        // Example: last day = 24h from "now minus 1 day" to "now"
        $now      = new \DateTime();
        $lastDay  = (clone $now)->modify('-1 day');
        $lastWeek = (clone $now)->modify('-7 days');
        $lastMonth= (clone $now)->modify('-1 month');

        $statsLastDay   = $this->discussionRepository->getUsageStats($lastDay, $now);
        $statsLastWeek  = $this->discussionRepository->getUsageStats($lastWeek, $now);
        $statsLastMonth = $this->discussionRepository->getUsageStats($lastMonth, $now);
        $statsTotal     = $this->discussionRepository->getUsageStats();

        // Add new stats
        $weeklyStats = $this->discussionRepository->getWeeklyDiscussionsLast2Months();
        $monthlyStats = $this->discussionRepository->getMonthlyDiscussionsLastYear();

        // Message statistics
        $weeklyMessageStats = $this->discussionRepository->getWeeklyMessagesLast2Months();
        $monthlyMessageStats = $this->discussionRepository->getMonthlyMessagesLastYear();

        // Quarterly stats
        $quarterlyStats = $this->discussionRepository->getQuarterlyStats($selectedYear);

        return $this->render('admin/dashboard.html.twig', [
            'totalUsers'        => $totalUsers,
            'totalAgents'       => $totalAgents,
            'totalDiscussions'  => $totalDiscussions,

            // These will be arrays with nbDiscussions, nbMessages, totalCost
            'statsLastDay'      => $statsLastDay,
            'statsLastWeek'     => $statsLastWeek,
            'statsLastMonth'    => $statsLastMonth,
            'statsTotal'        => $statsTotal,

            // Graph
            'weeklyStats' => $weeklyStats,
            'monthlyStats' => $monthlyStats,

            // Message Graph
            'weeklyMessageStats' => $weeklyMessageStats,
            'monthlyMessageStats' => $monthlyMessageStats,

            // Quarterly stats
            'quarterlyStats' => $quarterlyStats,
            'selectedFiscalYear' => $selectedYear,
            'currentFiscalYear' => $currentFiscalYear,
            'previousFiscalYear' => $selectedYear - 1,
            'nextFiscalYear' => $selectedYear + 1,
        ]);
    }

    /**
     * Calculate the current fiscal year (starts in April)
     * For example: if current date is March 2024, fiscal year is 2023
     * If current date is April 2024 or later, fiscal year is 2024
     */
    private function getCurrentFiscalYear(): int
    {
        $now = new \DateTime();
        $currentYear = (int) $now->format('Y');
        $currentMonth = (int) $now->format('n');

        // If we're in January, February, or March, we're in the previous fiscal year
        if ($currentMonth <= 3) {
            return $currentYear - 1;
        }

        return $currentYear;
    }

    public function configureDashboard(): Dashboard
    {
        return Dashboard::new()->setTitle('AgentHub Admin');
    }

    public function configureMenuItems(): iterable
    {
        yield MenuItem::linkToDashboard('Dashboard', 'fa fa-home');

        if ($this->isGranted('ROLE_USER_MANAGER') || $this->isGranted('ROLE_ADMIN')) {
            yield MenuItem::section('User Management');
            yield MenuItem::linkToCrud('Users', 'fa fa-user', User::class);
            yield MenuItem::linkToCrud('Teams', 'fa fa-users', Team::class);
        }

        if ($this->isGranted('ROLE_AGENT_MANAGER') || $this->isGranted('ROLE_ADMIN')) {
            yield MenuItem::section('AI Agent');
            yield MenuItem::linkToCrud('Agent', 'fa fa-robot', AIAgent::class);
            yield MenuItem::linkToCrud('Agent Archive', 'fa fa-robot', AIAgentArchive::class);
        }

        if ($this->isGranted('ROLE_ADMIN')) {
            yield MenuItem::section('Models & Providers');
            yield MenuItem::linkToCrud('Model', 'fa fa-brain', AIModel::class);
            yield MenuItem::linkToCrud('Provider', 'fa fa-server', AIProvider::class);
        }

        if ($this->isGranted('ROLE_SYSTEM_MANAGER') || $this->isGranted('ROLE_ADMIN')) {
            yield MenuItem::section('Memories  / Instructions');
            yield MenuItem::linkToCrud('Global RAG Memory', 'fa fa-brain', Memory::class);
            yield MenuItem::linkToCrud('Custom instruction', 'fa fa-cog', CustomInstruction::class);
            yield MenuItem::linkToCrud('Learning', 'fa fa-brain', AgentLearn::class);

            yield MenuItem::section('Actions');
            yield MenuItem::linkToCrud('Agent Actions', 'fa fa-bolt', Action::class);

            // yield MenuItem::section('Settings');

            yield MenuItem::section('Admin');
            yield MenuItem::linkToCrud('Prompt Variables', 'fa fa-cog', Settings::class);
            yield MenuItem::linkToCrud('Admin Settings', 'fa fa-cog', AdminSettings::class);

            yield MenuItem::linkToCrud('Terms of Use', 'fa-solid fa-file-contract', TermsOfUse::class);
        }

        if ($this->isGranted('ROLE_ADMIN')) {
        }

        if ($this->isGranted('ROLE_ADMIN')) {
            yield MenuItem::section('Public Agents');
            yield MenuItem::linkToRoute('View Discussions', 'fa fa-comments', 'admin_public_agents');
        }

        if ($this->isGranted('ROLE_ADMIN') || $this->isGranted('ROLE_STATS_VIEWER')) {
            yield MenuItem::section('Statistics');
            yield MenuItem::linkToRoute('User Stats', 'fa fa-chart-bar', 'admin_user_stats');
            yield MenuItem::linkToRoute('Agent Stats', 'fa fa-chart-line', 'admin_agent_stats');
        }
    }

}
