<?php

namespace App\Service\Action;

use App\Entity\Ai\AIAgent;

interface ActionInterface
{
    public function execute(AIAgent $agent, string $userMsg, array $data = [], ?callable $callback = null): mixed;
}