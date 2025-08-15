<?php

namespace App\Service\Ai\Agent;

use App\Entity\Ai\AIAgent;
use App\Entity\User\User;
use App\Repository\SettingsRepository;
use App\Repository\AdminSettingsRepository;
use App\Repository\User\UserRepository;
use Symfony\Bundle\SecurityBundle\Security;

class SystemMsgService
{
    public function __construct(
        private Security $security,
        private UserRepository $userRepository,
        private SettingsRepository $settingsRepository,
        private AdminSettingsRepository $adminSettingsRepository,
    ) {}


    public function getSystemMsg(AIAgent $agent): string
    {
        $systemPrompt = $agent->getSystemPrompt();
        $systemPrompt = $this->replaceCommonPlaceholders($systemPrompt, $agent);
        $systemPrompt = $this->replaceSettingsPlaceholders($systemPrompt);
        $systemPrompt = $this->replaceTeamMemberPlaceholder($systemPrompt, $agent);

        if ($agent->getConfigurationByKey('addTime')) {
            $systemPrompt .= "\n\nCurrent date: " . date('l, F j, Y');
        }

        return $systemPrompt;
    }

    private function replaceCommonPlaceholders(?string $text, AIAgent $agent): string
    {
        // Replace AgentName
        $text = str_replace('%AGENTNAME%', $agent->getName(), $text);

        $user = $this->security->getUser();
        if ($user instanceof User) {
            $text = str_replace('%USERNAME%', $user->getFirstName() . ' ' . $user->getLastName(), $text);
            $text = str_replace('%USERJOB%',  $user->getJobTitle(), $text);
            $text = str_replace('%USERBIO%',  $user->getBio(), $text);
        }

        return $text;
    }

    private function replaceSettingsPlaceholders(string $text): string
    {
        // Global Settings
        $settings = $this->settingsRepository->getAllSettings();
        foreach ($settings as $setting) {
            $text = str_replace('%'.$setting->getCode().'%', $setting->getValue(), $text);
        }

        // Admin Settings
        $adminSettings = $this->adminSettingsRepository->getAllSettings();
        foreach ($adminSettings as $setting) {
            $text = str_replace('%'.$setting->getCode().'%', $setting->getValue(), $text);
        }

        return $text;
    }

    private function replaceTeamMemberPlaceholder(string $text, AIAgent $agent): string
    {
        if (strpos($text, '%team_member%') === false) {
            return $text;
        }

        $currentUser = $this->security->getUser();
        if (!$currentUser instanceof User) {
            return $text;
        }

        $userTeams = $currentUser->getTeams();
        $agentTeams = $agent->getTeams()->toArray();

        // Get intersection of user teams and agent teams
        $relevantTeams = array_filter($agentTeams, function($team) use ($userTeams) {
            return in_array($team, $userTeams, true) && $team->getCode() !== 'default';
        });

        if (empty($relevantTeams)) {
            return $text;
        }

        $allTeamMembers = [];
        foreach ($relevantTeams as $team) {
            $teamMembers = $this->userRepository->getUsersByTeam($team);
            $allTeamMembers = array_merge($allTeamMembers, $teamMembers);
        }

        // Remove duplicates based on user ID
        $uniqueMembers = array_unique($allTeamMembers, SORT_REGULAR);

        $teamInfos = "## Team information\n" . implode("\n", array_map(function($user) {
            return sprintf(
                "- %s %s | %s | %s",
                $user->getFirstName(),
                $user->getLastName(),
                $user->getJobTitle() ?? 'No title',
                $user->getBio() ?? 'No bio'
            );
        }, $uniqueMembers));

        return str_replace('%team_member%', $teamInfos, $text);
    }


}