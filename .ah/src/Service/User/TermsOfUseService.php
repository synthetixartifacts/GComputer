<?php

namespace App\Service\User;

use App\Entity\Term\TermsOfUse;
use App\Entity\Term\UserTermsAcceptance;
use App\Entity\User\User;
use Doctrine\ORM\EntityManagerInterface;

class TermsOfUseService
{
    public function __construct(private EntityManagerInterface $entityManager) {}

    public function getLatestTerms(): ?TermsOfUse
    {
        return $this->entityManager->getRepository(TermsOfUse::class)->findOneBy([], ['createdAt' => 'DESC']);
    }

    public function hasUserAcceptedLatestTerms(User $user): bool
    {
        $latestTerms = $this->getLatestTerms();
        if (!$latestTerms) {
            return true;
        }

        foreach ($user->getTermsAcceptances() as $acceptance) {
            if ($acceptance->getTermsOfUse() === $latestTerms) {
                return true;
            }
        }

        return false;
    }

    public function acceptTerms(User $user, TermsOfUse $terms): void
    {
        $acceptance = new UserTermsAcceptance();
        $acceptance->setUser($user);
        $acceptance->setTermsOfUse($terms);
        $acceptance->setAcceptedAt(new \DateTime());

        $this->entityManager->persist($acceptance);
        $this->entityManager->flush();
    }
}