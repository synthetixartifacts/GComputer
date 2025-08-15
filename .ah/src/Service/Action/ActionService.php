<?php

namespace App\Service\Action;

use App\Entity\Action\Action;
use App\Entity\Ai\AIAgent;
use App\Repository\Ai\AgentRepository;
use App\Service\Ai\Agent\AgentRawCallService;
use App\Service\Action\ContactTommy;

use Psr\Log\LoggerInterface;

class ActionService
{
    public function __construct(
        private AgentRawCallService $rawCall,
        private AgentRepository $agentRepository,
        private ContactTommy $contactTommy,
        private LoggerInterface $logger,
        private LoggerInterface $ciaRequestLogger,
    ) {}




    public function getActionToExecute(AIAgent $agent, string $userMsg, ?array $customActions = []): ?string
    {
        return $this->getActionToExecuteByAgentForUserMsg($agent, $userMsg, $customActions) ?: null;
    }












    // public function executeAction(string $actionCode, AIAgent $agent, string $userMsg, array $data = [], ?callable $callback = null): mixed
    // {
    //     // Check if agent has this action
    //     if (!$agent->hasAction($action)) {
    //         $this->logger->warning('Agent does not have access to this action', [
    //             'agent'  => $agent->getCode(),
    //             'action' => $action->getCode()
    //         ]);
    //         return false;
    //     }

    //     switch ($action->getCode()) {
    //         case 'contact_tommy':
    //             return $this->contactTommy->execute($agent, $userMsg, $data, $callback);
    //             break;

    //         default:
    //             $this->logger->error('Action does not exist ' . $action->getCode());
    //             return false;
    //     }
    // }


    // public function executeActionForUserMsg(AIAgent $agent, string $userMsg, array $data = [], ?callable $callback = null)
    // {
    //     $actionToExecute = $this->getActionToExecuteByAgentForUserMsg($agent, $userMsg);

    //     if (!is_null($actionsToExecute)) {
    //         return false;
    //     }

    //     $this->executeAction($actionToExecute, $agent, $userMsg, $data, $callback);
    // }



    // Call LLM to decide if we should execute an action(s) an if so, which one(s)
    public function getActionToExecuteByAgentForUserMsg(AIAgent $agent, string $userMsg, ?array $customActions = []): ?string
    {
        // Get all action per agent
        $asAgent = $this->agentRepository->findLatestByCode('system_action_selector');
        if (!$asAgent) {
            $errorMessage = 'Action Selector agent not found';
            $this->logger->error($errorMessage);
            throw new \RuntimeException($errorMessage);
        }

        // Get all actions for the agent
        $actions = array_map(
            fn($action) => $action->toArray(),
            $agent->getActions()->toArray()
        );
        $actions = array_merge($actions ?: [], $customActions);
        if (empty($actions)) {
            return [];
        }

        // TODO make this dry
        if (!str_contains(strtolower($userMsg), 'user message')) {
            $userMsg = "# User message:\n" . $userMsg;
        }

        $messageText = $this->prepareMessageText($userMsg, $actions);
        $messageText = '<role_overide>' . $asAgent->getSystemPrompt() . "</role_overide>\n\n" . $messageText;

        try {
            $response     = $this->rawCall->talk($agent, $messageText);
            $actionChoice = $this->rawCall->getAgentResponseText($agent, $response);
            $action       = $this->extractActionFromAnswer($actionChoice, $actions);

            return $action;
        } catch (\Exception $e) {
            $this->logger->error('Failed to generate get action', ['error' => $e->getMessage()]);
            return '';
        }

        return null;
    }

    private function prepareMessageText($userMsg, $actions)
    {
        $messageText = "Look at this ongoing discussion andaction list to decide\n\n<discussion>\n";
        $messageText .= $this->truncateUserMessage($userMsg);
        $messageText .= "</discussion>\n\n-----\n\n";
        $messageText .= "# Action List for you to choose from [Format: code | description] \n";
        foreach ($actions as $action) {
            $messageText .= "- {$action['code']} | ";
            $messageText .= "{$action['description']}";
            $messageText .= "\n";
        }

        $messageText .= "\n\n-----\n\n Now ONLY if possible and useful, select ONE action code.";

        return $messageText;
    }

    // Make this a DRY function
    private function truncateUserMessage(string $userMsg, int $maxWords = 1500): string
    {
        $words = str_word_count($userMsg, 1); // Split into array of words
        $totalWords = count($words);

        if ($totalWords <= $maxWords) {
            return $userMsg;
        }

        $firstWords = array_slice($words, 0, (int)($maxWords * 0.25)); // Take ~25% from start
        $lastWords = array_slice($words, -((int)($maxWords * 0.75))); // Take ~75% from end

        return implode(' ', $firstWords) . " [...] " . PHP_EOL . implode(' ', $lastWords);
    }


    private function extractActionFromAnswer(string $actionChoice, array $actions): ?string
    {
        $trimmedChoice = trim($actionChoice);
        if ($trimmedChoice === '' || str_starts_with($trimmedChoice, 'No action required')) {
            return null;
        }

        foreach ($actions as $action) {
            // Split first line only and extract code
            $firstLine = strtok($trimmedChoice, "\n");
            $parts     = explode('|', trim($firstLine));
            $code      = trim(str_replace('-', '', $parts[0]));

            // Return first matching action
            if ($action['code'] === $code) {
                return $action['code'];
            }
        }

        return null;
    }


    private function extractActionsFromAnswer($actionChoice, $actions)
    {
        $trimmedChoice = trim($actionChoice);
        if ($trimmedChoice === '' || str_starts_with($trimmedChoice, 'No action required')) {
            return false;
        }

        $toExecuteActions = [];
        $chosenActions    = explode("\n", $actionChoice);

        foreach ($chosenActions as $chosenAction) {
            $parts = explode('|', trim($chosenAction));
            $code  = trim(str_replace('-', '',$parts[0]));

            // $this->ciaRequestLogger->debug(json_encode([$chosenMemory, $code, $searchQuery]));

            foreach ($actions as $action) {
                // Check for code match or title match (accounting for GPT mini inconsistencies)
                if ($action['code'] == $code) {
                    $toExecuteActions[] = $action;
                }
            }
        }

        return $toExecuteActions;
    }
}