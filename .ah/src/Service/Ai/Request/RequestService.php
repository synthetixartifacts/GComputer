<?php

namespace App\Service\Ai\Request;

use Psr\Log\LoggerInterface;

class RequestService
{
    public function __construct(
        private LoggerInterface $logger,
        private LoggerInterface $devLog,
    ) {}

}