<?php

namespace App\Service;

use App\Entity\Discussion\Discussion;
use App\Entity\User\User;
use App\Entity\Ai\AIAgent;
use App\Repository\DiscussionRepository;
use Doctrine\ORM\EntityManagerInterface;

class DiscussionService
{
    public function __construct(
        private DiscussionRepository $discussionRepository,
        private EntityManagerInterface $entityManager,
    ) {}

    public function getDiscussionByKeyUserOrCreate(?string $key, ?User $user, AIAgent $agent, bool $create = false): ?Discussion
    {
        if ($key) {
            $discussion = $this->discussionRepository->findByKeyAndUser($key, $user?->getId());
            if ($discussion) {
                return $discussion;
            }
        }

        if (!$create) {
            return null;
        }

        if (!$agent->isPublic() && !$user) {
            return null;
        }

        $discussion = new Discussion();
        $discussion
            ->setUser($user)
            ->setEnable(true)
            ->setTitle('New discussion')
            ->setFavorite(false)
            ->setAiAgent($agent);

        $this->discussionRepository->save($discussion, true);

        return $discussion;
    }

    public function validateDiscussionAccess(Discussion $discussion, ?User $user, AIAgent $agent): bool
    {
        if ($agent->isPublic()) {
            return $discussion->getAiAgent() === $agent;
        }

        return $discussion->getUser() === $user && $discussion->getAiAgent() === $agent;
    }
}