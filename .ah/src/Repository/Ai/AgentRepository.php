<?php

namespace App\Repository\Ai;

use App\Entity\Ai\AIAgent;
use App\Entity\Ai\AIModel;
use App\Entity\User\User;
use App\Entity\Settings;
use App\Service\Ai\Agent\AgentTalkService;
use App\Repository\Memory\MemoryRepository;
use App\Repository\Memory\CustomInstructionRepository;
use App\Repository\AdminSettingsRepository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Query\Expr\Join;

class AgentRepository extends ServiceEntityRepository
{
    public const MAI_USER_PREFIX = 'mai_user_';

    public function __construct(
        ManagerRegistry $registry,
        private EntityManagerInterface $entityManager,
        private MemoryRepository $memoryRepository,
        private CustomInstructionRepository $customInstructionRepository,
        private AdminSettingsRepository $adminSettingsRepository,
    ) {
        parent::__construct($registry, AIAgent::class);
    }

    public function userHasAccessToAgent(AIAgent $agent, User $user): bool
    {
        // Check if it's user's personal agent
        if ($user->getPersonalAgent()->getCode() === $agent->getCode()) {
            return true;
        }

        // Check team access
        return $this->createQueryBuilder('a')
            ->select('COUNT(a.id)')
            ->innerJoin('a.teams', 't')
            ->innerJoin('t.users', 'u')
            ->where('a = :agent')
            ->andWhere('u = :user')
            ->setParameter('agent', $agent)
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult() > 0;
    }

    public function getMemoryListArrayForAgent(AIAgent $agent): array
    {
        $memoryCodes = array_filter(array_map('trim', explode("\n", $agent->getMemory())));
        $memories = [];

        foreach ($memoryCodes as $code) {
            try {
                $code = ltrim($code, '- ');
                if ($memory = $this->memoryRepository->findOneBy(['code' => $code])) {
                    $memories[] = $memory;
                }
            } catch (\Exception) {
                continue;
            }
        }

        return $memories;
    }

        public function deleteAgentWithRelatedData(AIAgent $agent): void
    {
        // Remove any custom instructions associated with this agent
        $customInstructions = $this->customInstructionRepository->findBy(['agent' => $agent]);
        foreach ($customInstructions as $instruction) {
            $this->entityManager->remove($instruction);
        }

        // Remove any discussions associated with this agent
        $discussionRepository = $this->entityManager->getRepository(\App\Entity\Discussion\Discussion::class);
        $discussions = $discussionRepository->findBy(['aiAgent' => $agent]);
        foreach ($discussions as $discussion) {
            $this->entityManager->remove($discussion);
        }

        // Remove the agent itself
        $this->entityManager->remove($agent);
    }

    public function createMaiAgentForUser(User $user): ?AIAgent
    {
        if ($user->getPersonalAgent()) {
            return null;
        }

        // First we try to find the agent with the same code
        // If there are more than one, we delete the older ones and keep the latest one
        $maiAgents = $this->findBy(['code' => self::MAI_USER_PREFIX . $user->getId()], ['id' => 'DESC']);

        if (count($maiAgents) > 0) {
            $latestMai = $maiAgents[0]; // First one is the latest due to DESC ordering

            // Remove older duplicates if any exist
            for ($i = 1; $i < count($maiAgents); $i++) {
                $this->deleteAgentWithRelatedData($maiAgents[$i]);
            }

            // Only flush if we removed something
            if (count($maiAgents) > 1) {
                try {
                    $this->entityManager->flush();
                } catch (\Exception $e) {
                    echo 'Flush failed: ' . $e->getMessage() . '<br>';
                    echo 'Error details: ' . $e->getTraceAsString() . '<br>';
                }
            }

            $user->setPersonalAgent($latestMai);
            $this->entityManager->flush();
            return $latestMai;
        }

        $maiCode         = $this->adminSettingsRepository->getSetting('default_mai_model_code');
        $modelRepository = $this->entityManager->getRepository(AIModel::class);
        $model           = $modelRepository->findOneBy(['code' => $maiCode]);

        if (!$model) {
            throw new \Exception('AI Model not found for the given code');
        }

        $mai = new AIAgent();
        $mai->setName('Mai')
            ->setCode(self::MAI_USER_PREFIX . $user->getId())
            ->setDescription('Your own personal AI Agent')
            ->setImage('mia-66df25a4dfc0a.png')
            ->setEnable(true)
            ->setIsSystem(false)
            ->setVersion('1')
            ->setSystemPrompt('LOOK FOR SYSTEM SETTINGS')
            ->setParams(json_encode([]))
            ->setConfiguration(json_encode(['useMemory' => true, 'addTime' => true]))
            ->setModel($model);

        $this->entityManager->persist($mai);
        $user->setPersonalAgent($mai);
        $this->entityManager->flush();

        return $mai;
    }

    public function getEntityAgentListForUser(User $user): array
    {
        $personal_agent = $user->getPersonalAgent();
        $agents = $this->createQueryBuilder('a')
            ->select('DISTINCT a')
            ->innerJoin(
                AIAgent::class,
                'latest',
                Join::WITH,
                'a.code = latest.code AND a.version = latest.version'
            )
            ->innerJoin('a.teams', 't')
            ->innerJoin('t.users', 'u')
            ->andWhere('a.enable = true')
            ->andWhere('a.isSystem = false')
            ->andWhere('u.id = :userId')
            ->andWhere(
                'a.version = (
                    SELECT MAX(sub.version)
                    FROM ' . AIAgent::class . ' sub
                    WHERE sub.code = a.code
                )'
            )
            ->setParameter('userId', $user->getId())
            ->orderBy('a.name', 'ASC')
            ->getQuery()
            ->getResult();

        return $personal_agent ? array_merge([$personal_agent], $agents) : $agents;
    }

    public function getAgentListForUser(User $user): array
    {
        $agentList = [];
        $rawAgentList = $this->getEntityAgentListForUser($user);

        foreach ($rawAgentList as $agent) {
            $agentList[] = $agent->toArray();
        }

        return $agentList;
    }

    public function findLatestByCode(string $code): ?AIAgent
    {
        return $this->createQueryBuilder('a')
            ->andWhere('a.code = :code')
            ->setParameter('code', $code)
            ->orderBy('a.version', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Find all agents marked as public.
     *
     * @return AIAgent[]
     */
    public function findPublicAgents(): array
    {
        return $this->createQueryBuilder('a')
            ->andWhere('a.public = :isPublic')
            ->setParameter('isPublic', true)
            ->orderBy('a.name', 'ASC')
            ->getQuery()
            ->getResult();
    }
}