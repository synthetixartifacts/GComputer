<?php

namespace App\Service\Action;

use App\Entity\Ai\AIAgent;
use App\Service\Ai\Agent\AgentRawCallService;

abstract class AbstractAction implements ActionInterface
{
    public function __construct(
        protected AgentRawCallService $agentService,
    ) {}

    abstract public function execute(AIAgent $agent, string $userMsg, array $data = [], ?callable $callback = null): mixed;
}