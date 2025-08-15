<?php

namespace App\Repository\Action;

use App\Entity\Action\ActionState;
use App\Entity\Discussion\Discussion;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class ActionStateRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ActionState::class);
    }

    /**
     * @return ActionState[]
     */
    public function findByDiscussion(Discussion $discussion): array
    {
        return $this->createQueryBuilder('a')
            ->andWhere('a.discussion = :discussion')
            ->setParameter('discussion', $discussion)
            ->orderBy('a.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Creates a new ActionState entity
     */
    public function createActionState(Discussion $discussion, string $state, string $value): ActionState
    {
        $actionState = new ActionState();
        $actionState->setDiscussion($discussion)
            ->setState($state)
            ->setValue($value)
            ->setCreatedAt(new \DateTime())
            ->setUpdatedAt(new \DateTime());

        $this->getEntityManager()->persist($actionState);
        $this->getEntityManager()->flush();

        return $actionState;
    }

    public function updateState(ActionState $actionState, string $state, string $value): ActionState
    {
        $actionState
            ->setState($state)
            ->setValue($value)
            ->setUpdatedAt(new \DateTime());

        $this->getEntityManager()->flush();

        return $actionState;
    }
}