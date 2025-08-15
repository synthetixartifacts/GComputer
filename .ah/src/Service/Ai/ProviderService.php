<?php

namespace App\Service\Ai;

use App\Entity\Ai\AIAgent;
use App\Entity\Ai\AIProvider;
use App\Service\Ai\Provider\TogetherProvider;
use App\Service\Ai\Provider\OpenAiProvider;
use App\Service\Ai\Provider\AnthropicProvider;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

class ProviderService
{
    public function __construct(
        private TogetherProvider $togetherProvider,
        private OpenAiProvider $openAiProvider,
        private AnthropicProvider $anthropicProvider,
        private EntityManagerInterface $entityManager,
        private LoggerInterface $logger,
    ) {}

    public function getProperProviderService(AIAgent $agent) {
        switch ($agent->getModel()->getProvider()->getCode()) {
            case 'together':
                return $this->togetherProvider;
                break;

            case 'open_ai2':
            case 'open_ai':
                return $this->openAiProvider;
                break;

            case 'anthropic':
                return $this->anthropicProvider;
                break;

            default:
                $this->logger->error('Provider does not exist ' . $agent->getModel()->getProvider()->getCode());
                return null;
        }
    }

    public function getProvider(int $id): ?AIProvider
    {
        return $this->entityManager->getRepository(AIProvider::class)->find($id);
    }
}