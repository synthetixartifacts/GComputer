<?php

namespace App\Controller\User;

use KnpU\OAuth2ClientBundle\Client\ClientRegistry;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

class AzureController extends AbstractController
{
    public function __construct(
        private CsrfTokenManagerInterface $csrfTokenManager,
    ) {}

    #[Route('/connect/azure', name: 'connect_azure_start')]
    public function connectAction(ClientRegistry $clientRegistry): Response
    {
        // Generate CSRF token and store in session
        $state = $this->csrfTokenManager->getToken('azure_oauth')->getValue();

        return $clientRegistry
            ->getClient('azure')
            ->redirect([
                'openid',
                'profile',
                'email',
            ], [
                'state' => $state
            ]);
    }

    #[Route('/connect/azure/check', name: 'connect_azure_check')]
    public function connectCheckAction(): Response
    {
        return new Response();
    }
}