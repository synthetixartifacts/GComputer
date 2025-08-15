<?php

namespace App\Controller\Api;

use App\Service\Api\ApiHelperService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

abstract class AbstractBaseApiController extends AbstractController
{
    public function __construct(
        protected ApiHelperService $apiHelperService
    ) {}
}