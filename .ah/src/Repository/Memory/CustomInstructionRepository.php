<?php

namespace App\Repository\Memory;

use App\Entity\Memory\CustomInstruction;
use App\Entity\User\User;
use App\Entity\Ai\AIAgent;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class CustomInstructionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CustomInstruction::class);
    }

    public function getUserCustomInstructionValue(AIAgent $agent, User $user): ?string
    {
        try {
            return $this->createQueryBuilder('ci')
                ->select('ci.value')
                ->where('ci.agent = :agent')
                ->andWhere('ci.user = :user')
                ->andWhere('ci.type = :type')
                ->setParameter('agent', $agent)
                ->setParameter('user', $user)
                ->setParameter('type', 'user')
                ->getQuery()
                ->getSingleScalarResult();
        } catch (\Doctrine\ORM\NoResultException $e) {
            return null;
        }
    }

    public function getDefaultCustomInstructionValue(AIAgent $agent): ?string
    {
        try {
            return $this->createQueryBuilder('ci')
                ->select('ci.value')
                ->where('ci.agent = :agent')
                ->andWhere('ci.type = :type')
                ->setParameter('agent', $agent)
                ->setParameter('type', 'default')
                ->getQuery()
                ->getSingleScalarResult();
        } catch (\Doctrine\ORM\NoResultException $e) {
            return null;
        }
    }

    public function updateCustomInstructionForAgentByUser(string $instruction, AIAgent $agent, User $user): void
    {
        $entityManager = $this->getEntityManager();

        // Check if a CustomInstruction already exists for this agent and user
        $existingInstruction = $this->findOneBy([
            'agent' => $agent,
            'user'  => $user,
        ]);

        if ($existingInstruction) {
            // Update existing instruction
            $existingInstruction->setValue($instruction);
            $existingInstruction->setUpdatedAt(new \DateTime());
        } else {
            // Create new instruction
            $newInstruction = new CustomInstruction();
            $newInstruction->setAgent($agent);
            $newInstruction->setUser($user);
            $newInstruction->setType('user');
            $newInstruction->setValue($instruction);
            $newInstruction->setCreatedAt(new \DateTime());
            $newInstruction->setUpdatedAt(new \DateTime());

            $entityManager->persist($newInstruction);
        }

        // Flush changes to database
        $entityManager->flush();
    }

    public function updateCustomInstructionForAgent(string $instruction, AIAgent $agent): void
    {
        $entityManager = $this->getEntityManager();

        // Check if a default CustomInstruction already exists for this agent
        $existingInstruction = $this->findOneBy([
            'agent' => $agent,
            'type'  => 'default',
            'user'  => null,
        ]);

        if ($existingInstruction) {
            // Update existing instruction
            $existingInstruction->setValue($instruction);
            $existingInstruction->setUpdatedAt(new \DateTime());
        } else {
            // Create new instruction
            $newInstruction = new CustomInstruction();
            $newInstruction->setAgent($agent);
            $newInstruction->setUser(null);
            $newInstruction->setType('default');
            $newInstruction->setValue($instruction);
            $newInstruction->setCreatedAt(new \DateTime());
            $newInstruction->setUpdatedAt(new \DateTime());

            $entityManager->persist($newInstruction);
        }

        // Flush changes to database
        $entityManager->flush();
    }
}