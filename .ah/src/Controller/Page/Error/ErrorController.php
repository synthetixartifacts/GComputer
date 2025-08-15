<?php

namespace App\Controller\Page\Error;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ErrorController extends AbstractController
{
    public function __construct(
        private ParameterBagInterface $params
    ) {}

    public function show(\Throwable $exception): Response
    {
        if ($exception instanceof HttpException && $exception->getStatusCode() === 404) {
            return $this->render('pages/single/error404.html.twig', [
                'exception' => $exception,
            ], new Response('', 404));
        }

        if ($this->params->get('kernel.environment') !== 'prod') {
            throw $exception;
        }

        // TODO - Manage this
        // Handle other errors by showing the error500 page
        return $this->render('pages/single/error404.html.twig', [
            'exception' => $exception,
        ], new Response('', 500));
    }
}