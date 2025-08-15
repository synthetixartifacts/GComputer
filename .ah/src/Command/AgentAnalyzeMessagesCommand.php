<?php

namespace App\Command;

use App\Entity\Memory\AgentLearn;
use App\Repository\Ai\AgentRepository;
// use App\Repository\Memory\AgentLearnRepository;
use App\Repository\User\UserRepository;
use App\Service\Ai\Agent\AgentService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:agent:analyze-messages',
    description: 'Analyze user messages and create agent learning entries',
)]
class AgentAnalyzeMessagesCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private AgentRepository $agentRepository,
        private UserRepository $userRepository,
        // private AgentLearnRepository $agentLearnRepository,
        private AgentService $agentService,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $users = $this->userRepository->findAll();
        $agents = $this->agentRepository->findAll();

        foreach ($users as $user) {
            foreach ($agents as $agent) {
                // Get or create AgentLearn entry
                $agentLearn = $this->agentLearnRepository->findOneBy([
                    'user' => $user,
                    'agent' => $agent,
                    'type' => 'global'
                ]) ?? new AgentLearn();

                // Get all messages for this user and agent
                $messages = $this->entityManager->createQuery(
                    'SELECT m FROM App\Entity\Discussion\Message m
                    WHERE m.user = :user
                    AND m.agent = :agent
                    AND m.type = :type'
                )
                ->setParameters([
                    'user' => $user,
                    'agent' => $agent,
                    'type' => 'user'
                ])
                ->getResult();

                if (empty($messages)) {
                    continue;
                }

                // Prepare messages for analysis
                $messagesContent = array_map(fn($msg) => $msg->getContent(), $messages);

                // Call LLM to analyze messages
                $analysis = $this->agentService->analyzeMessages($messagesContent);

                // Update or create AgentLearn entry
                if (!$agentLearn->getId()) {
                    $agentLearn->setAgent($agent)
                        ->setUser($user)
                        ->setType('global');
                }

                $agentLearn->setValue($analysis);

                $this->entityManager->persist($agentLearn);
                $this->entityManager->flush();

                $io->text(sprintf('Processed messages for User ID: %d, Agent ID: %d', $user->getId(), $agent->getId()));
            }
        }

        $io->success('Message analysis completed');
        return Command::SUCCESS;
    }
}