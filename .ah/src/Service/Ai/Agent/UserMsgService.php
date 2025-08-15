<?php

namespace App\Service\Ai\Agent;

use App\Entity\Ai\AIAgent;
use App\Service\Ai\RagService;
use App\Service\Web\BrowseUrlService;
use App\Repository\User\UserRepository;
use App\Repository\Memory\CustomInstructionRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Psr\Log\LoggerInterface;

class UserMsgService
{
    public function __construct(
        private RagService $ragService,
        private Security $security,
        private UserRepository $userRepository,
        private CustomInstructionRepository $customInstructionRepository,
        private BrowseUrlService $browseUrlService,
        private LoggerInterface $ciaRequestLogger,
    ) {}


    // TODO - We need to return the real last user message to at the end so that we can save the proper message in db
    public function getUserMsg(AIAgent $agent, string $userMessage): string
    {
        $message = [];

        // Split after "# NEW user message you have to answer:"
        $userMessageParts = explode("# NEW user message you have to answer:", $userMessage);
        $realLastUserMsg = trim($userMessageParts[1] ?? $userMessage);

        // TODO validate that the user wants us to browse the urls
        // Can browse user pasted links and is there a link in the user message?
        if ($agent->getConfigurationByKey('canBrowseUrl')) {
            $urls = $this->browseUrlService->extractUrlsFromMessage($realLastUserMsg);

            // $this->ciaRequestLogger->debug(json_encode([$realLastUserMsg]));

            foreach ($urls as $url) {
                $content = $this->browseUrlService->extractContentFromUrl($url);

                // $this->ciaRequestLogger->debug(json_encode([$url, $content]));

                $message[] = $content;
            }
        }

        // Handle RAG
        if ($agent->getConfigurationByKey('useRagSystemMemory')) {
            $ragMemory = $this->ragService->getRagMemoryForUserMsg($agent, $userMessage);
            if (!empty($ragMemory)) {
                $message[] = $ragMemory;
            }
        }

        // Handle Custom Instructions
        $customInstruction = $this->buildCustomInstruction($agent);
        if (!empty($customInstruction)) {
            $message[] = sprintf('<custom_instruction>\n%s\n</custom_instruction>', $customInstruction);
        }

        $message[] = $userMessage;

        return implode('', $message);
    }


    private function buildCustomInstruction(AIAgent $agent): string
    {
        $defaultInstruction = $this->customInstructionRepository->getDefaultCustomInstructionValue($agent) ?? '';

        $user = $this->security->getUser();
        if (!$user) {
            return $defaultInstruction;
        }

        $userInstruction = $this->customInstructionRepository->getUserCustomInstructionValue($agent, $user) ?? '';
        if (empty($userInstruction)) {
            return $defaultInstruction;
        }

        return empty($defaultInstruction)
            ? $userInstruction
            : $defaultInstruction . "\n\n" . $userInstruction;
    }
}